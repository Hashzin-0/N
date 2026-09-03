'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LiveVoiceOrb3DProps {
  status: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';
  userVolume: number;
  agentVolume: number;
  audioFrequencyData?: Uint8Array;
  className?: string;
  size?: number;
}

export default function LiveVoiceOrb3D({
  status,
  userVolume,
  agentVolume,
  className = '',
  size = 180,
}: LiveVoiceOrb3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mesh refs for animation
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const ring1Ref = useRef<THREE.Mesh | null>(null);
  const ring2Ref = useRef<THREE.Mesh | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);

  // Target colors for smooth lerping
  const targetColorCore = useRef<THREE.Color>(new THREE.Color('#5A5A40'));
  const targetColorGlow = useRef<THREE.Color>(new THREE.Color('#C5A880'));

  // Mouse interaction
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Keep latest dynamic values accessible to 60fps animation loop without re-triggering Three.js setup
  const dynamicStateRef = useRef({ status, userVolume, agentVolume });
  useEffect(() => {
    dynamicStateRef.current = { status, userVolume, agentVolume };
  }, [status, userVolume, agentVolume]);

  useEffect(() => {
    // Update target colors based on agent state
    if (status === 'speaking') {
      // Puck speaking: Radiant emerald and vibrant lime
      targetColorCore.current.set('#2E6F40');
      targetColorGlow.current.set('#68D391');
    } else if (status === 'listening') {
      // User speaking: Warm amber and golden harvest
      targetColorCore.current.set('#C5832B');
      targetColorGlow.current.set('#F6E05E');
    } else if (status === 'thinking') {
      // Executing tool / thinking: Bioluminescent cyan/amber
      targetColorCore.current.set('#319795');
      targetColorGlow.current.set('#81E6D9');
    } else if (status === 'error') {
      // Error: muted terra cotta
      targetColorCore.current.set('#E53E3E');
      targetColorGlow.current.set('#FEB2B2');
    } else {
      // Idle / Connecting: Calm natural earth and olive tones
      targetColorCore.current.set('#5A5A40');
      targetColorGlow.current.set('#C5A880');
    }
  }, [status]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = size;
    const height = size;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.8;
    cameraRef.current = camera;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xd4a373, 3, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    const backLight = new THREE.PointLight(0x5a5a40, 2, 10);
    backLight.position.set(-2, -2, -2);
    scene.add(backLight);

    // 1. Organic Core Geometry (Icosahedron with subdivision)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 4);
    // Store original positions for deformation
    const positionAttr = coreGeo.attributes.position;
    const originalPositions = new Float32Array(positionAttr.array.length);
    originalPositions.set(positionAttr.array);
    coreGeo.userData = { originalPositions };

    const coreMat = new THREE.MeshStandardMaterial({
      color: targetColorCore.current,
      roughness: 0.25,
      metalness: 0.15,
      flatShading: false,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // 2. Translucent outer wireframe lattice
    const wireGeo = new THREE.IcosahedronGeometry(1.4, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: targetColorGlow.current,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);
    wireframeMeshRef.current = wireMesh;

    // 3. Orbital Ring 1
    const ring1Geo = new THREE.TorusGeometry(1.65, 0.02, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: targetColorGlow.current,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);
    ring1Ref.current = ring1;

    // 4. Orbital Ring 2
    const ring2Geo = new THREE.TorusGeometry(1.85, 0.015, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: targetColorCore.current,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);
    ring2Ref.current = ring2;

    // 5. Floating Orbital Particles
    const particleCount = 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.6 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Drag interaction handlers
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) {
        // Soft tilt on hover
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.8;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 0.8;
        mousePos.current.targetX = nx;
        mousePos.current.targetY = ny;
        return;
      }
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      coreMesh.rotation.y += dx * 0.01;
      coreMesh.rotation.x += dy * 0.01;
      wireMesh.rotation.y += dx * 0.01;
      wireMesh.rotation.x += dy * 0.01;
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse tilt
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      // Audio influence factor
      const { status: curStatus, userVolume: curUserVol, agentVolume: curAgentVol } = dynamicStateRef.current;
      const effectiveVol = curStatus === 'speaking' ? curAgentVol : curUserVol;
      const audioPulse = Math.min(1.5, 1.0 + effectiveVol * 1.8);

      // Interpolate material colors
      if (coreMat.color) {
        coreMat.color.lerp(targetColorCore.current, 0.06);
      }
      if (wireMat.color) {
        wireMat.color.lerp(targetColorGlow.current, 0.06);
      }
      if (pointLightRef.current) {
        pointLightRef.current.color.lerp(targetColorGlow.current, 0.06);
        pointLightRef.current.intensity = 2.0 + effectiveVol * 4.0;
      }

      // Deform core vertices organically with time and audio volume
      if (coreMeshRef.current) {
        const geo = coreMeshRef.current.geometry as THREE.BufferGeometry;
        const pos = geo.attributes.position;
        const orig = geo.userData.originalPositions as Float32Array;

        const waveSpeed = curStatus === 'speaking' ? 4.5 : curStatus === 'listening' ? 3.0 : 1.2;
        const waveAmp = (curStatus === 'speaking' ? 0.22 : curStatus === 'listening' ? 0.16 : 0.06) * audioPulse;

        for (let i = 0; i < pos.count; i++) {
          const ox = orig[i * 3];
          const oy = orig[i * 3 + 1];
          const oz = orig[i * 3 + 2];

          // Compute distance from origin
          const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
          const nx = ox / len;
          const ny = oy / len;
          const nz = oz / len;

          // Trigonometric wave displacement
          const displacement =
            Math.sin(nx * 4.0 + elapsedTime * waveSpeed) *
            Math.cos(ny * 4.0 + elapsedTime * waveSpeed) *
            Math.sin(nz * 4.0 + elapsedTime * waveSpeed) *
            waveAmp;

          const factor = (len + displacement) / len;
          pos.setXYZ(i, ox * factor, oy * factor, oz * factor);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();

        // Rotations
        coreMeshRef.current.rotation.y += 0.008 + (curStatus === 'thinking' ? 0.03 : 0);
        coreMeshRef.current.rotation.x = mousePos.current.y * 0.4;
        coreMeshRef.current.rotation.z = mousePos.current.x * 0.4;
      }

      // Outer wireframe
      if (wireframeMeshRef.current) {
        wireframeMeshRef.current.rotation.y -= 0.005;
        wireframeMeshRef.current.rotation.z += 0.003;
        wireframeMeshRef.current.scale.setScalar(1.0 + (audioPulse - 1.0) * 0.5);
      }

      // Orbital Rings
      if (ring1Ref.current) {
        ring1Ref.current.rotation.z += curStatus === 'thinking' ? 0.04 : 0.01;
        ring1Ref.current.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 1.5) * 0.1;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.z -= curStatus === 'thinking' ? 0.03 : 0.008;
        ring2Ref.current.rotation.y = Math.PI / 4 + Math.cos(elapsedTime * 1.2) * 0.1;
      }

      // Floating particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.003;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title="Assistente de Voz 3D Puck (Arraste para girar)"
    />
  );
}
