'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useIsMobile } from '@/hooks/use-mobile';

interface SectionConfig {
  id: string;
  label: string;
  shortLabel: string;
  geometry: 'dodecahedron' | 'box' | 'octahedron' | 'torusknot' | 'icosahedron' | 'cone' | 'torus' | 'sphere' | 'cylinder';
  color: string;
  colorDark: string;
}

const NITROGEN_SECTIONS: SectionConfig[] = [
  { id: 'preset_selector', label: 'Cenários', shortLabel: 'Cenários', geometry: 'dodecahedron', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'form_section', label: 'Parâmetros', shortLabel: 'Parâmetros', geometry: 'box', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'results_section', label: 'Resultados', shortLabel: 'Resultados', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
  { id: 'parceling_section', label: 'Parcelamento', shortLabel: 'Parcelamento', geometry: 'torusknot', color: '#D4A373', colorDark: '#D4A373' },
  { id: 'detailed_math_panel', label: 'Fórmulas', shortLabel: 'Fórmulas', geometry: 'icosahedron', color: '#8D6E63', colorDark: '#CBB5A1' },
];

const CORN_SECTIONS: SectionConfig[] = [
  { id: 'corn_yield_header', label: 'Visão Geral', shortLabel: 'Visão Geral', geometry: 'sphere', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_params', label: 'Parâmetros', shortLabel: 'Parâmetros', geometry: 'cylinder', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'corn_yield_alerts', label: 'Alertas', shortLabel: 'Alertas', geometry: 'cone', color: '#D4A373', colorDark: '#E0A96D' },
  { id: 'corn_yield_visual', label: 'Visual', shortLabel: 'Visual', geometry: 'torus', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_results', label: 'Resultados', shortLabel: 'Resultados', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
];

const COMPARATOR_SECTIONS: SectionConfig[] = [
  { id: 'scenario_comparator_section', label: 'Comparador', shortLabel: 'Comparador', geometry: 'box', color: '#5A5A40', colorDark: '#9CB386' },
];

function createGeometry(type: SectionConfig['geometry']): THREE.BufferGeometry {
  switch (type) {
    case 'dodecahedron': return new THREE.DodecahedronGeometry(1, 0);
    case 'box': return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    case 'octahedron': return new THREE.OctahedronGeometry(1, 0);
    case 'torusknot': return new THREE.TorusKnotGeometry(0.7, 0.25, 48, 8);
    case 'icosahedron': return new THREE.IcosahedronGeometry(1, 0);
    case 'cone': return new THREE.ConeGeometry(0.8, 1.6, 6);
    case 'torus': return new THREE.TorusGeometry(0.8, 0.3, 12, 24);
    case 'sphere': return new THREE.SphereGeometry(1, 16, 12);
    case 'cylinder': return new THREE.CylinderGeometry(0.7, 0.7, 1.4, 12);
    default: return new THREE.OctahedronGeometry(1, 0);
  }
}

/* Sample random surface points from a geometry (for particle morph targets) */
function sampleGeometryPoints(type: SectionConfig['geometry'], count: number): Float32Array {
  const geo = createGeometry(type);
  const posAttr = geo.getAttribute('position');
  const index = geo.getIndex();
  const out = new Float32Array(count * 3);

  if (index) {
    const triCount = index.count / 3;
    for (let i = 0; i < count; i++) {
      const tri = Math.floor(Math.random() * triCount);
      const i0 = index.getX(tri * 3);
      const i1 = index.getX(tri * 3 + 1);
      const i2 = index.getX(tri * 3 + 2);
      const u = Math.random();
      const v = Math.random() * (1 - u);
      const w = 1 - u - v;
      out[i * 3]     = posAttr.getX(i0) * u + posAttr.getX(i1) * v + posAttr.getX(i2) * w;
      out[i * 3 + 1] = posAttr.getY(i0) * u + posAttr.getY(i1) * v + posAttr.getY(i2) * w;
      out[i * 3 + 2] = posAttr.getZ(i0) * u + posAttr.getZ(i1) * v + posAttr.getZ(i2) * w;
    }
  } else {
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * posAttr.count);
      out[i * 3]     = posAttr.getX(idx);
      out[i * 3 + 1] = posAttr.getY(idx);
      out[i * 3 + 2] = posAttr.getZ(idx);
    }
  }

  geo.dispose();
  return out;
}

/* ─── Single 3D Icon Canvas ─── */
function NavIcon3D({
  config,
  isActive,
  isHovered,
  isDark,
}: {
  config: SectionConfig;
  isActive: boolean;
  isHovered: boolean;
  isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const isActiveRef = useRef(isActive);
  const isHoveredRef = useRef(isHovered);
  const targetScale = useRef(1);
  const currentScale = useRef(1);
  const [contextLost, setContextLost] = useState(false);
  const webglSupportedRef = useRef<boolean | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || contextLost) return;

    if (webglSupportedRef.current === null) {
      try {
        const testCanvas = document.createElement('canvas');
        webglSupportedRef.current = !!(testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
      } catch {
        webglSupportedRef.current = false;
      }
    }
    if (!webglSupportedRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.MeshStandardMaterial | null = null;
    let ringGeo: THREE.TorusGeometry | null = null;
    let ringMat: THREE.MeshBasicMaterial | null = null;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };

    const onContextRestored = () => {
      setContextLost(false);
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    try {
      const size = 56;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.z = 3.2;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const ambient = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 1.8);
      dir.position.set(2, 3, 4);
      scene.add(dir);
      const back = new THREE.DirectionalLight(0xa5c9eb, 0.6);
      back.position.set(-2, -1, -3);
      scene.add(back);

      const colorHex = parseInt((isDark ? config.colorDark : config.color).replace('#', ''), 16);
      geo = createGeometry(config.geometry);
      mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.15,
        roughness: 0.35,
        metalness: 0.25,
        wireframe: config.geometry === 'box',
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      ringGeo = new THREE.TorusGeometry(1.5, 0.06, 8, 32);
      ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0,
        wireframe: true,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      scene.add(ring);

      const clock = new THREE.Clock();
      const animate = () => {
        animFrameId.current = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        const speed = isHoveredRef.current ? 0.025 : 0.006;
        mesh.rotation.y += speed;
        mesh.rotation.x += speed * 0.4;

        targetScale.current = isActiveRef.current ? 1.25 : isHoveredRef.current ? 1.1 : 1.0;
        currentScale.current += (targetScale.current - currentScale.current) * 0.1;
        mesh.scale.setScalar(currentScale.current);

        mat!.emissiveIntensity = isActiveRef.current ? 0.45 + Math.sin(elapsed * 3) * 0.2 : 0.15;

        ringMat!.opacity = isActiveRef.current ? 0.4 + Math.sin(elapsed * 2.5) * 0.15 : 0;
        ring.rotation.z = elapsed * 0.5;

        renderer!.render(scene, camera);
      };
      animate();
    } catch {
      // WebGL renderer creation failed
    }

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer?.dispose();
      geo?.dispose();
      mat?.dispose();
      ringGeo?.dispose();
      ringMat?.dispose();
    };
  }, [config.geometry, config.color, config.colorDark, isDark, contextLost]);

  const colorHex = isDark ? config.colorDark : config.color;

  if (contextLost) {
    return (
      <div
        className="w-[56px] h-[56px] flex items-center justify-center"
        style={{
          filter: isActive
            ? `drop-shadow(0 0 10px ${isDark ? 'rgba(156,187,134,0.6)' : 'rgba(90,90,64,0.5)'})`
            : 'none',
          transition: 'filter 0.4s ease',
        }}
      >
        <div
          className="w-8 h-8 rounded-full"
          style={{
            backgroundColor: colorHex,
            boxShadow: `0 0 12px ${colorHex}60`,
            opacity: isActive ? 0.9 : 0.5,
          }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-[56px] h-[56px] pointer-events-none"
      style={{
        filter: isActive
          ? `drop-shadow(0 0 10px ${isDark ? 'rgba(156,187,134,0.6)' : 'rgba(90,90,64,0.5)'})`
          : 'none',
        transition: 'filter 0.4s ease',
      }}
    />
  );
}

/* ─── Morphing Particle Transition (per-icon staggered) ─── */
function MorphTransitionEffect({
  active,
  isDark,
  onComplete,
  vertical,
  fromSections,
  toSections,
  iconPositions,
}: {
  active: boolean;
  isDark: boolean;
  onComplete: () => void;
  vertical: boolean;
  fromSections: SectionConfig[];
  toSections: SectionConfig[];
  iconPositions: Map<string, number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) { onComplete(); return; }

    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const parent = canvas.parentElement;
      const width = vertical ? 90 : (parent?.clientWidth || 800);
      const height = vertical ? (parent?.clientHeight || 400) : 90;

      const scene = new THREE.Scene();
      const aspect = width / height;
      const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
      camera.position.z = 20;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const onContextLost = (e: Event) => {
        e.preventDefault();
        if (animRef.current) cancelAnimationFrame(animRef.current);
        onComplete();
      };
      const onContextRestored = () => onComplete();

      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);

      /* ── Camera frustum dimensions ── */
      const vFov = (50 * Math.PI) / 180;
      const frustumHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
      const frustumWidth = frustumHeight * aspect;

      /* ── Map icon fractional positions → 3D world coords ── */
      const toWorldPos = (frac: number) => {
        if (vertical) {
          return { x: 0, y: (0.5 - frac) * frustumHeight * 0.85, z: 0 };
        }
        return { x: (frac - 0.5) * frustumWidth * 0.85, y: 0, z: 0 };
      };

      /* ── Per-icon stagger delay (100ms between each icon) ── */
      const PARTICLES_PER_ICON = 50;
      const maxIcons = Math.max(fromSections.length, toSections.length, 1);
      const totalParticles = PARTICLES_PER_ICON * maxIcons;
      const STAGGER_MS = 100;
      const totalStagger = (maxIcons - 1) * STAGGER_MS;

      const iconDelays: number[] = [];
      const iconWorldPositions: { x: number; y: number; z: number }[] = [];
      for (let idx = 0; idx < maxIcons; idx++) {
        iconDelays.push(idx * STAGGER_MS);
        const cfg = fromSections[idx] || fromSections[0];
        const pos = iconPositions.get(cfg.id);
        iconWorldPositions.push(pos !== undefined ? toWorldPos(pos) : toWorldPos(0.5));
      }

      /* ── Particle arrays ── */
      const positions = new Float32Array(totalParticles * 3);
      const endPositions = new Float32Array(totalParticles * 3);
      const velocities = new Float32Array(totalParticles * 3);
      const baseColors = new Float32Array(totalParticles * 3);
      const targetColors = new Float32Array(totalParticles * 3);
      const particleIconIdx = new Uint8Array(totalParticles);

      for (let iconIdx = 0; iconIdx < maxIcons; iconIdx++) {
        const fromConfig = fromSections[iconIdx] || fromSections[fromSections.length - 1];
        const toConfig = toSections[iconIdx] || toSections[toSections.length - 1];

        const fromPos = iconPositions.get(fromConfig.id);
        const toPos = iconPositions.get((toSections[iconIdx] || toSections[0]).id);

        const fromWorld = fromPos !== undefined ? toWorldPos(fromPos) : toWorldPos(0.5);
        const toWorld = toPos !== undefined ? toWorldPos(toPos) : toWorldPos(0.5);

        const fromPts = sampleGeometryPoints(fromConfig.geometry, PARTICLES_PER_ICON);
        const toPts = sampleGeometryPoints(toConfig.geometry, PARTICLES_PER_ICON);

        const fromCol = new THREE.Color(
          parseInt((isDark ? fromConfig.colorDark : fromConfig.color).replace('#', ''), 16)
        );
        const toCol = new THREE.Color(
          parseInt((isDark ? toConfig.colorDark : toConfig.color).replace('#', ''), 16)
        );

        for (let p = 0; p < PARTICLES_PER_ICON; p++) {
          const i = iconIdx * PARTICLES_PER_ICON + p;
          const i3 = i * 3;

          particleIconIdx[i] = iconIdx;

          const sx = fromWorld.x + fromPts[p * 3] * 0.5;
          const sy = fromWorld.y + fromPts[p * 3 + 1] * 0.5;
          const sz = fromWorld.z + fromPts[p * 3 + 2] * 0.5;

          positions[i3] = sx;
          positions[i3 + 1] = sy;
          positions[i3 + 2] = sz;

          endPositions[i3] = toWorld.x + toPts[p * 3] * 0.5;
          endPositions[i3 + 1] = toWorld.y + toPts[p * 3 + 1] * 0.5;
          endPositions[i3 + 2] = toWorld.z + toPts[p * 3 + 2] * 0.5;

          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 2.5;
          const zVel = (Math.random() - 0.5) * 2;
          velocities[i3] = Math.cos(angle) * speed;
          velocities[i3 + 1] = Math.sin(angle) * speed;
          velocities[i3 + 2] = zVel;

          baseColors[i3] = fromCol.r;
          baseColors[i3 + 1] = fromCol.g;
          baseColors[i3 + 2] = fromCol.b;

          targetColors[i3] = toCol.r;
          targetColors[i3 + 1] = toCol.g;
          targetColors[i3 + 2] = toCol.b;
        }
      }

      /* ── Points geometry ── */
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(baseColors.slice(), 3));

      const mat = new THREE.PointsMaterial({
        size: 2.0,
        transparent: true,
        opacity: 0.95,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);

      /* ── Per-icon shockwave rings ── */
      const dissolveRings: THREE.Mesh[] = [];
      const reformRings: THREE.Mesh[] = [];
      const dissolveRingGeo = new THREE.TorusGeometry(2.5, 0.25, 12, 40);
      const reformRingGeo = new THREE.TorusGeometry(1.5, 0.18, 12, 40);

      for (let idx = 0; idx < maxIcons; idx++) {
        const wp = iconWorldPositions[idx];

        const dMat = new THREE.MeshBasicMaterial({
          color: isDark ? 0xD4A373 : 0x5A5A40,
          transparent: true,
          opacity: 0,
          wireframe: true,
          blending: THREE.AdditiveBlending,
        });
        const dRing = new THREE.Mesh(dissolveRingGeo, dMat);
        dRing.position.set(wp.x, wp.y, wp.z);
        dRing.rotation.x = Math.PI / 4;
        scene.add(dRing);
        dissolveRings.push(dRing);

        const rMat = new THREE.MeshBasicMaterial({
          color: isDark ? 0x9CB386 : 0x2E6F40,
          transparent: true,
          opacity: 0,
          wireframe: true,
          blending: THREE.AdditiveBlending,
        });
        const rRing = new THREE.Mesh(reformRingGeo, rMat);
        rRing.position.set(wp.x, wp.y, wp.z);
        rRing.rotation.x = Math.PI / 3;
        scene.add(rRing);
        reformRings.push(rRing);
      }

      /* ── Animation timing ── */
      const DURATION = 1200 + totalStagger;
      const DISSOLVE_END = 0.35;
      const HOLD_END = 0.50;
      const startTime = performance.now();

      const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
      const colorArr = colorAttr.array as Float32Array;

      /* ── Compute per-icon normalized delay offsets (0→1 range within DURATION) ── */
      const iconDelayNorm = iconDelays.map((d) => d / DURATION);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const tGlobal = Math.min(elapsed / DURATION, 1);

        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;

        for (let i = 0; i < totalParticles; i++) {
          const i3 = i * 3;
          const iconIdx = particleIconIdx[i];
          const delay = iconDelayNorm[iconIdx];

          /* Per-particle local time: shifted by icon delay, stretched to fill remaining duration */
          const tLocal = Math.min(Math.max((tGlobal - delay) / (1 - delay), 0), 1);

          if (tLocal <= 0) {
            /* Not yet this icon's turn — particles invisible */
            posArr[i3 + 2] = -10;
            continue;
          }

          if (tLocal <= DISSOLVE_END) {
            /* ── Phase 1: DISSOLVE — particles fly outward from source ── */
            const phaseT = tLocal / DISSOLVE_END;
            const ease = 1 - Math.pow(1 - phaseT, 3);

            posArr[i3]     += velocities[i3]     * 0.016 * (1 + ease * 2);
            posArr[i3 + 1] += velocities[i3 + 1] * 0.016 * (1 + ease * 2);
            posArr[i3 + 2] += velocities[i3 + 2] * 0.016;

          } else if (tLocal <= HOLD_END) {
            /* ── Phase 2: HOLD — particles drift gently, almost frozen ── */
            posArr[i3]     += velocities[i3]     * 0.001;
            posArr[i3 + 1] += velocities[i3 + 1] * 0.001;
            posArr[i3 + 2] += Math.sin(now * 0.003 + i) * 0.002;

          } else {
            /* ── Phase 3: REFORM — particles converge to target positions ── */
            const phaseT = (tLocal - HOLD_END) / (1 - HOLD_END);
            const ease = phaseT < 0.5
              ? 4 * phaseT * phaseT * phaseT
              : 1 - Math.pow(-2 * phaseT + 2, 3) / 2;

            const lerpFactor = ease * 0.08;
            posArr[i3]     += (endPositions[i3]     - posArr[i3])     * lerpFactor;
            posArr[i3 + 1] += (endPositions[i3 + 1] - posArr[i3 + 1]) * lerpFactor;
            posArr[i3 + 2] += (endPositions[i3 + 2] - posArr[i3 + 2]) * lerpFactor;
          }

          /* ── Color interpolation per particle ── */
          const colorMix = tLocal <= DISSOLVE_END ? 0 : Math.min((tLocal - DISSOLVE_END) / 0.4, 1);
          colorArr[i3]     = baseColors[i3]     + (targetColors[i3]     - baseColors[i3])     * colorMix;
          colorArr[i3 + 1] = baseColors[i3 + 1] + (targetColors[i3 + 1] - baseColors[i3 + 1]) * colorMix;
          colorArr[i3 + 2] = baseColors[i3 + 2] + (targetColors[i3 + 2] - baseColors[i3 + 2]) * colorMix;
        }

        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;

        /* ── Per-icon rings: each ring animates on its own staggered timeline ── */
        for (let idx = 0; idx < maxIcons; idx++) {
          const delay = iconDelayNorm[idx];
          const tLocal = Math.min(Math.max((tGlobal - delay) / (1 - delay), 0), 1);

          const dRing = dissolveRings[idx];
          const dMat = dRing.material as THREE.MeshBasicMaterial;
          const rRing = reformRings[idx];
          const rMat = rRing.material as THREE.MeshBasicMaterial;

          if (tLocal <= 0) {
            dMat.opacity = 0;
            rMat.opacity = 0;
          } else if (tLocal <= DISSOLVE_END) {
            const ringT = tLocal / DISSOLVE_END;
            const s = 1 + ringT * 6;
            dRing.scale.set(s, s, s);
            dRing.rotation.z += 0.05;
            dMat.opacity = (1 - ringT) * 0.5;
            rMat.opacity = 0;
          } else if (tLocal <= HOLD_END) {
            dMat.opacity *= 0.93;
            rMat.opacity = 0;
          } else {
            dMat.opacity = 0;
            const ring2T = (tLocal - HOLD_END) / (1 - HOLD_END);
            const s2 = 6 * (1 - ring2T) + 0.3;
            rRing.scale.set(s2, s2, s2);
            rRing.rotation.z -= 0.04;
            rMat.opacity = Math.sin(ring2T * Math.PI) * 0.45;
          }
        }

        /* ── Overall opacity: fade in at start, fade out at end ── */
        const fadeIn = Math.min(tGlobal / 0.03, 1);
        const fadeOut = tGlobal > 0.92 ? (1 - tGlobal) / 0.08 : 1;
        mat.opacity = fadeIn * fadeOut * 0.9;

        renderer!.render(scene, camera);

        if (tGlobal < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          onComplete();
          renderer?.dispose();
          geo.dispose();
          mat.dispose();
          dissolveRingGeo.dispose();
          reformRingGeo.dispose();
          for (const r of dissolveRings) { (r.material as THREE.MeshBasicMaterial).dispose(); }
          for (const r of reformRings) { (r.material as THREE.MeshBasicMaterial).dispose(); }
        }
      };

      animRef.current = requestAnimationFrame(animate);

      return () => {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      };
    } catch {
      onComplete();
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer?.dispose();
    };
  }, [active, isDark, onComplete, vertical, fromSections, toSections, iconPositions]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

/* ─── Main SectionNav3D Component ─── */
export default function SectionNav3D({
  activeTab,
  onNavigate,
}: {
  activeTab: string;
  onNavigate?: (sectionId: string) => void;
}) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const scrollProgress = useScrollProgress();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevTabRef = useRef(activeTab);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [iconPositions, setIconPositions] = useState<Map<string, number>>(new Map());
  const [transitionFromSections, setTransitionFromSections] = useState<SectionConfig[]>(NITROGEN_SECTIONS);
  const prevSectionsRef = useRef<SectionConfig[]>(NITROGEN_SECTIONS);

  const sections = useMemo(() => {
    if (activeTab === 'estimativa_milho') return CORN_SECTIONS;
    if (activeTab === 'comparador') return COMPARATOR_SECTIONS;
    return NITROGEN_SECTIONS;
  }, [activeTab]);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const currentSection = useScrollSpy({
    sectionIds,
    enabled: !isTransitioning,
  });

  const activeIndex = useMemo(() => {
    if (!currentSection) return 0;
    const idx = sections.findIndex((s) => s.id === currentSection);
    return idx >= 0 ? idx : 0;
  }, [currentSection, sections]);

  // Measure icon positions along the scroll axis
  useEffect(() => {
    const container = containerRef.current;
    if (!container || sections.length === 0) return;

    const measure = () => {
      const positions = new Map<string, number>();
      sections.forEach((config) => {
        const btn = iconRefs.current.get(config.id);
        if (!btn) return;
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        if (isMobile) {
          // Horizontal: position along X axis as fraction of container width
          const pos = (btnRect.left - containerRect.left + btnRect.width / 2) / containerRect.width;
          positions.set(config.id, pos);
        } else {
          // Vertical: position along Y axis as fraction of container height
          const pos = (btnRect.top - containerRect.top + btnRect.height / 2) / containerRect.height;
          positions.set(config.id, pos);
        }
      });
      setIconPositions(positions);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sections, isMobile]);

  // Map scroll progress to indicator position along the icon axis
  const indicatorProgress = useMemo(() => {
    if (iconPositions.size === 0) return 0;
    // The scroll progress maps linearly to the indicator travel
    return scrollProgress;
  }, [scrollProgress, iconPositions]);

  // Determine which icons the progress bar has "passed" (for activation animation)
  const passedIcons = useMemo(() => {
    const passed = new Set<string>();
    iconPositions.forEach((pos, id) => {
      if (indicatorProgress >= pos) {
        passed.add(id);
      }
    });
    return passed;
  }, [indicatorProgress, iconPositions]);

  const handleClick = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onNavigate?.(sectionId);
    }
  }, [onNavigate]);

  // Transition effect when tab changes
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setTransitionFromSections(prevSectionsRef.current);
      setIsTransitioning(true);
      prevTabRef.current = activeTab;
      prevSectionsRef.current = sections;
    }
  }, [activeTab, sections]);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  // Compute indicator transform
  const indicatorTransform = isMobile
    ? `translateX(${indicatorProgress * 100}%)`
    : `translateY(${indicatorProgress * 100}%)`;

  const indicatorLength = isMobile ? '24px' : '24px';

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? 'w-full' : 'h-full'}`}
      role="tablist"
      aria-label="Navegação de seções"
    >
      <MorphTransitionEffect
        active={isTransitioning}
        isDark={isDark}
        onComplete={handleTransitionComplete}
        vertical={!isMobile}
        fromSections={transitionFromSections}
        toSections={sections}
        iconPositions={iconPositions}
      />

      {/* Icons + Progress Track */}
      <div
        className={`relative ${
          isMobile
            ? 'flex items-end justify-between px-2 sm:px-4'
            : 'flex flex-col items-center justify-between py-2 px-1 h-full'
        }`}
      >
        {/* Progress Track (background line) */}
        <div
          className={`absolute ${
            isMobile
              ? 'bottom-[28px] left-2 right-2 h-1'
              : 'left-[28px] top-2 bottom-2 w-1'
          } bg-[#E5E2D9] dark:bg-[#2C3328] rounded-full overflow-hidden`}
        >
          {/* Filled portion - continuous with scroll */}
          <div
            className="absolute rounded-full"
            style={{
              background: isDark
                ? 'linear-gradient(to right, #9CB386, #D4A373, #CBB5A1)'
                : 'linear-gradient(to right, #5A5A40, #D4A373, #8D6E63)',
              ...(isMobile
                ? {
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${indicatorProgress * 100}%`,
                    transition: 'width 0.15s ease-out',
                  }
                : {
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${indicatorProgress * 100}%`,
                    transition: 'height 0.15s ease-out',
                  }),
            }}
          />
          {/* Glowing dot at the tip */}
          <div
            className="absolute rounded-full bg-white shadow-lg"
            style={{
              width: isMobile ? '8px' : '8px',
              height: isMobile ? '8px' : '8px',
              boxShadow: `0 0 8px ${isDark ? '#9CB386' : '#5A5A40'}`,
              ...(isMobile
                ? {
                    top: '50%',
                    left: `calc(${indicatorProgress * 100}% - 4px)`,
                    transform: 'translateY(-50%)',
                    transition: 'left 0.15s ease-out',
                  }
                : {
                    left: '50%',
                    top: `calc(${indicatorProgress * 100}% - 4px)`,
                    transform: 'translateX(-50%)',
                    transition: 'top 0.15s ease-out',
                  }),
            }}
          />
        </div>

        {/* Icon Buttons */}
        {sections.map((config, index) => {
          const isActive = currentSection === config.id;
          const isPassed = passedIcons.has(config.id);
          const isHoveredBtn = hoveredId === config.id;

          return (
            <button
              key={config.id}
              ref={(el) => {
                if (el) iconRefs.current.set(config.id, el);
              }}
              role="tab"
              aria-selected={isActive}
              aria-label={config.label}
              title={config.label}
              onClick={() => handleClick(config.id)}
              onMouseEnter={() => setHoveredId(config.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative flex ${
                isMobile ? 'flex-col items-center gap-1' : 'flex-row items-center gap-2'
              } group outline-none z-10`}
            >
              {/* 3D Icon */}
              <div
                className="transition-all duration-300"
                style={{
                  transform: isActive
                    ? isMobile ? 'translateY(-4px)' : 'translateX(-4px)'
                    : isHoveredBtn
                      ? isMobile ? 'translateY(-2px)' : 'translateX(-2px)'
                      : 'translate(0)',
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                  opacity: isTransitioning ? 0 : 1,
                }}
              >
                <NavIcon3D
                  config={config}
                  isActive={isActive || isPassed}
                  isHovered={isHoveredBtn}
                  isDark={isDark}
                />
              </div>

              {/* Label */}
              <span
                className={`${
                  isMobile
                    ? 'text-[10px] sm:text-[11px] max-w-[80px]'
                    : 'text-[10px] max-w-[70px]'
                } font-bold uppercase tracking-wider transition-all duration-300 text-center leading-tight ${
                  isActive
                    ? 'text-[#5A5A40] dark:text-[#9CB386] opacity-100'
                    : isPassed
                      ? 'text-[#D4A373] dark:text-[#D4A373] opacity-90'
                      : 'text-[#8C897E] dark:text-[#9EA399] opacity-50 group-hover:opacity-100 group-hover:text-[#5A5A40] dark:group-hover:text-[#E8E6DF]'
                }`}
              >
                {isMobile ? config.shortLabel : config.label}
              </span>

              {/* Active dot */}
              {isActive && (
                <span
                  className={`absolute ${
                    isMobile
                      ? '-bottom-2 left-1/2 -translate-x-1/2'
                      : '-right-2 top-1/2 -translate-y-1/2'
                  } w-1.5 h-1.5 rounded-full bg-[#D4A373] animate-pulse`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
