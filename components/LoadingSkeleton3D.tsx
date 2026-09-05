'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';
import { useWebGLManager } from '@/hooks/useWebGLManager';
import SideRays from './SideRays';

interface LoadingSkeleton3DProps {
  onComplete: () => void;
  duration?: number;
}

type Phase = 'growing' | 'interactive' | 'collapsing' | 'done';

interface LeafDef {
  heightPct: number;
  side: 1 | -1;
  angle: number;
  length: number;
  width: number;
  curl: number;
  delay: number;
}

interface RootDef {
  angle: number;
  length: number;
  thickness: number;
  delay: number;
}

function buildLeafGeometry(length: number, width: number, curl: number, segments = 12): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(length, width, segments, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const normalizedX = (x + length / 2) / length;
    const curlAmount = curl * normalizedX * normalizedX;
    const droop = -0.3 * normalizedX * normalizedX * width;
    pos.setZ(i, curlAmount);
    pos.setY(i, y + droop);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildStalkGeometry(height: number, radiusBottom: number, radiusTop: number, segments = 12): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 8);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normalizedY = (y + height / 2) / height;
    const wave = Math.sin(normalizedY * Math.PI * 4) * 0.02;
    const x = pos.getX(i);
    pos.setX(i, x + wave);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildRootGeometry(length: number, thickness: number, segments = 8): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.3, -length * 0.4, thickness * 2),
    new THREE.Vector3(length * 0.6, -length * 0.7, -thickness),
    new THREE.Vector3(length, -length, thickness),
  ]);
  return new THREE.TubeGeometry(curve, segments, thickness, 6, false);
}

export default function LoadingSkeleton3D({
  onComplete,
  duration = 4000,
}: LoadingSkeleton3DProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('growing');
  const [progress, setProgress] = useState(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const startTimeRef = useRef(0);
  const hoveredPartRef = useRef<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const { webglSupported, acquire, release } = useWebGLManager();

  const leaves = useMemo<LeafDef[]>(() => [
    { heightPct: 0.25, side: 1, angle: 0.3, length: 1.8, width: 0.35, curl: 0.4, delay: 0 },
    { heightPct: 0.25, side: -1, angle: -0.3, length: 1.6, width: 0.32, curl: -0.35, delay: 100 },
    { heightPct: 0.40, side: 1, angle: 0.5, length: 2.2, width: 0.4, curl: 0.5, delay: 200 },
    { heightPct: 0.40, side: -1, angle: -0.5, length: 2.0, width: 0.38, curl: -0.45, delay: 250 },
    { heightPct: 0.55, side: 1, angle: 0.4, length: 2.5, width: 0.45, curl: 0.55, delay: 350 },
    { heightPct: 0.55, side: -1, angle: -0.4, length: 2.3, width: 0.42, curl: -0.5, delay: 400 },
    { heightPct: 0.70, side: 1, angle: 0.6, length: 2.0, width: 0.38, curl: 0.6, delay: 500 },
    { heightPct: 0.70, side: -1, angle: -0.6, length: 1.9, width: 0.36, curl: -0.55, delay: 550 },
    { heightPct: 0.85, side: 1, angle: 0.2, length: 1.5, width: 0.3, curl: 0.3, delay: 650 },
    { heightPct: 0.85, side: -1, angle: -0.2, length: 1.4, width: 0.28, curl: -0.25, delay: 700 },
  ], []);

  const roots = useMemo<RootDef[]>(() => [
    { angle: 0, length: 1.2, thickness: 0.03, delay: 0 },
    { angle: Math.PI * 0.5, length: 1.0, thickness: 0.025, delay: 50 },
    { angle: Math.PI, length: 1.1, thickness: 0.028, delay: 100 },
    { angle: Math.PI * 1.5, length: 0.9, thickness: 0.022, delay: 150 },
    { angle: Math.PI * 0.25, length: 0.8, thickness: 0.02, delay: 200 },
    { angle: Math.PI * 0.75, length: 0.85, thickness: 0.02, delay: 220 },
    { angle: Math.PI * 1.25, length: 0.75, thickness: 0.018, delay: 250 },
    { angle: Math.PI * 1.75, length: 0.7, thickness: 0.018, delay: 270 },
  ], []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((clientY - rect.top) / rect.height) * 2 - 1;
    mouseRef.current = { x, y };
    targetRotationRef.current = { x: y * 0.3, y: x * 0.6 };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('touchmove', handleMouseMove, { passive: true });
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('touchmove', handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    if (!webglSupported) {
      const timer = setTimeout(() => onComplete(), duration);
      return () => clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    let renderer: THREE.WebGLRenderer | null = null;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      onComplete();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(0, 1.5, 6);
      camera.lookAt(0, 1.2, 0);

      renderer = acquire(canvas, { maxDPR: 2, powerPreference: 'high-performance' });
      if (!renderer) { onComplete(); return; }
      renderer.setSize(width, height);
      renderer.setClearColor(isDark ? 0x0a0f08 : 0xf5f3ed, 1);

      const ambientLight = new THREE.AmbientLight(isDark ? 0x4a6a3a : 0xc8d8b8, 0.6);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(isDark ? 0x9cb386 : 0xfff8e7, 1.2);
      dirLight.position.set(3, 5, 4);
      scene.add(dirLight);
      const rimLight = new THREE.DirectionalLight(isDark ? 0xd4a373 : 0x5a5a40, 0.4);
      rimLight.position.set(-2, 3, -3);
      scene.add(rimLight);

      const stalkMat = new THREE.MeshPhongMaterial({
        color: isDark ? 0x4a6a3a : 0x5a7a40,
        emissive: isDark ? 0x1a2a10 : 0x2a3a18,
        emissiveIntensity: 0.15,
        shininess: 30,
      });
      const leafMat = new THREE.MeshPhongMaterial({
        color: isDark ? 0x6a9a50 : 0x7aaa55,
        emissive: isDark ? 0x1a3a10 : 0x2a4a18,
        emissiveIntensity: 0.1,
        shininess: 20,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      const rootMat = new THREE.MeshPhongMaterial({
        color: isDark ? 0x8a7a60 : 0xa09070,
        emissive: isDark ? 0x2a2010 : 0x3a3020,
        emissiveIntensity: 0.1,
        shininess: 10,
        transparent: true,
        opacity: 0,
      });
      const glowMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x9cb386 : 0x5a5a40,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });

      const plantGroup = new THREE.Group();
      scene.add(plantGroup);

      const stalkHeight = 3.5;
      const stalkGeo = buildStalkGeometry(stalkHeight, 0.08, 0.04);
      const stalk = new THREE.Mesh(stalkGeo, stalkMat.clone());
      stalk.position.y = stalkHeight / 2;
      stalk.userData = { type: 'stalk', label: 'Caule — Transporte de N' };
      plantGroup.add(stalk);

      const tasselGeo = new THREE.ConeGeometry(0.15, 0.6, 8);
      const tassel = new THREE.Mesh(tasselGeo, stalkMat.clone());
      tassel.position.y = stalkHeight + 0.3;
      tassel.userData = { type: 'tassel', label: 'Panicula — Flores masculinas' };
      plantGroup.add(tassel);

      const tasselThreads: THREE.Line[] = [];
      for (let i = 0; i < 6; i++) {
        const points = [];
        const angle = (i / 6) * Math.PI * 2;
        for (let j = 0; j <= 8; j++) {
          const t = j / 8;
          points.push(new THREE.Vector3(
            Math.cos(angle) * t * 0.3,
            stalkHeight + 0.6 + t * 0.4 + Math.sin(t * Math.PI) * 0.15,
            Math.sin(angle) * t * 0.3,
          ));
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: isDark ? 0x9cb386 : 0x7a9a5a,
          transparent: true,
          opacity: 0,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        plantGroup.add(line);
        tasselThreads.push(line);
      }

      const leafMeshes: THREE.Mesh[] = [];
      leaves.forEach((leafDef) => {
        const geo = buildLeafGeometry(leafDef.length, leafDef.width, leafDef.curl);
        const mat = leafMat.clone();
        const mesh = new THREE.Mesh(geo, mat);
        const yPos = stalkHeight * leafDef.heightPct;
        mesh.position.set(0, yPos, 0);
        mesh.rotation.set(0, leafDef.side > 0 ? 0.3 : -0.3, leafDef.side * leafDef.angle);
        mesh.scale.set(0, 0, 0);
        mesh.userData = {
          type: 'leaf',
          label: `Folha — Fotossíntese e N`,
          delay: leafDef.delay,
          targetScale: 1,
        };
        plantGroup.add(mesh);
        leafMeshes.push(mesh);
      });

      const rootMeshes: THREE.Mesh[] = [];
      roots.forEach((rootDef) => {
        const geo = buildRootGeometry(rootDef.length, rootDef.thickness);
        const mat = rootMat.clone();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.y = rootDef.angle;
        mesh.scale.set(0, 0, 0);
        mesh.userData = {
          type: 'root',
          label: 'Raiz — Absorção de N e água',
          delay: rootDef.delay,
          targetScale: 1,
        };
        plantGroup.add(mesh);
        rootMeshes.push(mesh);
      });

      const glowSpheres: THREE.Mesh[] = [];
      const glowGeo = new THREE.SphereGeometry(0.06, 12, 12);
      for (let i = 0; i < 12; i++) {
        const mat = glowMat.clone();
        const sphere = new THREE.Mesh(glowGeo, mat);
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.5;
        sphere.position.set(
          Math.cos(angle) * radius,
          0.5 + Math.random() * 2.5,
          Math.sin(angle) * radius,
        );
        sphere.userData = { phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 1.5 };
        plantGroup.add(sphere);
        glowSpheres.push(sphere);
      }

      const particleCount = 60;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleSpeeds = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 2;
        particlePositions[i * 3 + 1] = Math.random() * 3;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;
        particleSpeeds[i * 3 + 1] = 0.005 + Math.random() * 0.015;
        particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: isDark ? 0x9cb386 : 0xd4a373,
        size: 0.04,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      plantGroup.add(particles);

      const groundGeo = new THREE.CircleGeometry(2, 32);
      const groundMat = new THREE.MeshPhongMaterial({
        color: isDark ? 0x2a2a18 : 0xc8b898,
        transparent: true,
        opacity: 0,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      plantGroup.add(ground);

      startTimeRef.current = performance.now();

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const growDuration = duration * 0.55;
        const interactiveDuration = duration * 0.25;
        const collapseDuration = duration * 0.2;

        const growEnd = growDuration;
        const interactiveEnd = growEnd + interactiveDuration;
        const collapseEnd = interactiveEnd + collapseDuration;

        if (elapsed < growEnd) {
          if (phase !== 'growing') setPhase('growing');
          const t = Math.min(elapsed / growEnd, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setProgress(eased * 0.6);

          const stalkScale = Math.min(eased * 1.5, 1);
          stalk.scale.y = stalkScale;
          (stalk.material as THREE.MeshPhongMaterial).opacity = stalkScale;

          tassel.position.y = stalkHeight * stalkScale + 0.3;
          tassel.scale.set(stalkScale, stalkScale, stalkScale);
          (tassel.material as THREE.MeshPhongMaterial).opacity = stalkScale;

          tasselThreads.forEach((thread) => {
            (thread.material as THREE.LineBasicMaterial).opacity = Math.max(0, (eased - 0.5) * 2) * 0.6;
          });

          leafMeshes.forEach((mesh) => {
            const delay = mesh.userData.delay as number;
            const leafT = Math.max(0, (elapsed - delay) / (growDuration - delay));
            const leafEased = Math.min(leafT * 1.5, 1);
            const s = leafEased;
            mesh.scale.set(s, s, s);
            (mesh.material as THREE.MeshPhongMaterial).opacity = leafEased * 0.9;
          });

          rootMeshes.forEach((mesh) => {
            const delay = mesh.userData.delay as number;
            const rootT = Math.max(0, (elapsed - delay) / (growDuration * 0.6 - delay));
            const rootEased = Math.min(rootT * 2, 1);
            const s = rootEased;
            mesh.scale.set(s, s, s);
            (mesh.material as THREE.MeshPhongMaterial).opacity = rootEased * 0.8;
          });

          glowSpheres.forEach((sphere) => {
            const phase = sphere.userData.phase as number;
            const opacity = Math.sin((elapsed / 500) + phase) * 0.3 + 0.3;
            (sphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, opacity * eased);
          });

          particleMat.opacity = eased * 0.5;
          const pPos = particleGeo.attributes.position;
          for (let i = 0; i < particleCount; i++) {
            pPos.array[i * 3] += particleSpeeds[i * 3];
            pPos.array[i * 3 + 1] += particleSpeeds[i * 3 + 1];
            pPos.array[i * 3 + 2] += particleSpeeds[i * 3 + 2];
            if ((pPos.array[i * 3 + 1] as number) > 4) {
              pPos.array[i * 3 + 1] = 0;
            }
          }
          pPos.needsUpdate = true;

          groundMat.opacity = eased * 0.4;

        } else if (elapsed < interactiveEnd) {
          if (phase !== 'interactive') setPhase('interactive');
          const t = (elapsed - growEnd) / interactiveDuration;
          setProgress(0.6 + t * 0.3);

          glowSpheres.forEach((sphere) => {
            const phase = sphere.userData.phase as number;
            const pulse = Math.sin((elapsed / 400) + phase) * 0.4 + 0.5;
            (sphere.material as THREE.MeshBasicMaterial).opacity = pulse;
          });

          particleMat.opacity = 0.5 + Math.sin(elapsed / 300) * 0.2;
          const pPos = particleGeo.attributes.position;
          for (let i = 0; i < particleCount; i++) {
            pPos.array[i * 3] += particleSpeeds[i * 3] * 0.5;
            pPos.array[i * 3 + 1] += particleSpeeds[i * 3 + 1] * 0.5;
            pPos.array[i * 3 + 2] += particleSpeeds[i * 3 + 2] * 0.5;
            if ((pPos.array[i * 3 + 1] as number) > 4) {
              pPos.array[i * 3 + 1] = 0;
            }
          }
          pPos.needsUpdate = true;

        } else if (elapsed < collapseEnd) {
          if (phase !== 'collapsing') setPhase('collapsing');
          const t = (elapsed - interactiveEnd) / collapseDuration;
          const eased = t * t;
          setProgress(0.9 + t * 0.1);

          plantGroup.scale.set(1 - eased * 0.5, 1 - eased, 1 - eased * 0.5);
          plantGroup.rotation.y += 0.02;

          particleMat.opacity = (1 - t) * 0.8;
          const pPos = particleGeo.attributes.position;
          for (let i = 0; i < particleCount; i++) {
            pPos.array[i * 3] += particleSpeeds[i * 3] * (1 + t * 5);
            pPos.array[i * 3 + 1] += particleSpeeds[i * 3 + 1] * (1 + t * 3);
            pPos.array[i * 3 + 2] += particleSpeeds[i * 3 + 2] * (1 + t * 5);
          }
          pPos.needsUpdate = true;

          renderer!.setClearColor(
            new THREE.Color(isDark ? 0x0a0f08 : 0xf5f3ed).lerp(
              new THREE.Color(isDark ? 0x0a0f08 : 0xf5f3ed),
              t,
            ),
            1,
          );

        } else {
          if (phase !== 'done') setPhase('done');
          setProgress(1);
          onComplete();
          return;
        }

        const targetX = targetRotationRef.current.x;
        const targetY = targetRotationRef.current.y;
        const idleY = Math.sin(elapsed / 2000) * 0.1;
        currentRotationRef.current.x += (targetX - currentRotationRef.current.x) * 0.05;
        currentRotationRef.current.y += (targetY + idleY - currentRotationRef.current.y) * 0.05;
        plantGroup.rotation.x = currentRotationRef.current.x;
        plantGroup.rotation.y = currentRotationRef.current.y;

        pointer.x = mouseRef.current.x;
        pointer.y = -mouseRef.current.y;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(plantGroup.children, false);
        const newHovered = intersects.length > 0 ? (intersects[0].object.userData.type as string || null) : null;
        if (newHovered !== hoveredPartRef.current) {
          hoveredPartRef.current = newHovered;
          setHoveredPart(newHovered);
        }

        renderer!.render(scene, camera);
        animRef.current = requestAnimationFrame(animate);
      };

      animRef.current = requestAnimationFrame(animate);
    } catch {
      onComplete();
    }

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (renderer) release(renderer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webglSupported, acquire, release, onComplete, duration, isDark, leaves, roots]);

  const handleSkip = useCallback(() => {
    setPhase('done');
    setProgress(1);
    onComplete();
  }, [onComplete]);

  const labels: Record<string, string> = {
    stalk: 'Caule — Transporte de N',
    leaf: 'Folha — Fotossíntese e N',
    root: 'Raiz — Absorção de N e água',
    tassel: 'Panicula — Flores masculinas',
  };

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing"
          style={{ background: isDark ? '#0a0f08' : '#f5f3ed' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {webglSupported ? (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-64">
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 rounded-full"
                  style={{ background: isDark ? '#4a6a3a' : '#5a7a40' }}
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-16 h-3 rounded-full"
                    style={{
                      background: isDark ? '#6a9a50' : '#7aaa55',
                      bottom: `${20 + i * 18}%`,
                      left: i % 2 === 0 ? '50%' : 'auto',
                      right: i % 2 !== 0 ? '50%' : 'auto',
                      transformOrigin: i % 2 === 0 ? 'left center' : 'right center',
                    }}
                    initial={{ scaleX: 0, rotate: i % 2 === 0 ? 20 : -20 }}
                    animate={{ scaleX: 1, rotate: i % 2 === 0 ? 15 : -15 }}
                    transition={{ delay: 0.5 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none">
            <SideRays
              speed={1.5}
              rayColor1={isDark ? '#4a6a3a' : '#D4A373'}
              rayColor2={isDark ? '#9cb386' : '#96c8ff'}
              intensity={1.2}
              spread={1.5}
              origin="top-right"
              tilt={0}
              saturation={1.0}
              blend={0.6}
              falloff={1.8}
              opacity={0.4}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 pb-12 px-4 z-10">
            <div className="w-full max-w-xs flex flex-col items-center gap-3">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#1a2a10' : '#e5e2d9' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${isDark ? '#5a7a40' : '#5a5a40'}, ${isDark ? '#9cb386' : '#d4a373'})`,
                    width: `${progress * 100}%`,
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p
                className="text-xs font-medium tracking-wider uppercase"
                style={{ color: isDark ? '#9cb386' : '#5a5a40' }}
              >
                {phase === 'growing' && 'Crescendo esqueleto...'}
                {phase === 'interactive' && 'Interaja com a planta'}
                {phase === 'collapsing' && 'Preparando...'}
              </p>
            </div>

            {hoveredPart && labels[hoveredPart] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide backdrop-blur-md border"
                style={{
                  background: isDark ? 'rgba(26,42,16,0.85)' : 'rgba(245,243,237,0.9)',
                  color: isDark ? '#9cb386' : '#5a5a40',
                  borderColor: isDark ? 'rgba(156,179,134,0.3)' : 'rgba(90,90,64,0.2)',
                }}
              >
                {labels[hoveredPart]}
              </motion.div>
            )}

            <button
              onClick={handleSkip}
              className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all hover:scale-105 active:scale-95 border"
              style={{
                background: isDark ? 'rgba(26,42,16,0.6)' : 'rgba(245,243,237,0.6)',
                color: isDark ? '#9cb386' : '#5a5a40',
                borderColor: isDark ? 'rgba(156,179,134,0.3)' : 'rgba(90,90,64,0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Entrar
            </button>
          </div>

          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
            <h1
              className="text-lg sm:text-xl font-black tracking-tight"
              style={{ color: isDark ? '#e8e6df' : '#3a3a28' }}
            >
              Agronômica N-Pro
            </h1>
            <p
              className="text-[10px] tracking-[0.25em] uppercase font-medium"
              style={{ color: isDark ? '#6a7a5a' : '#8c897e' }}
            >
              Calculadora de Nitrogênio para Milho
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
