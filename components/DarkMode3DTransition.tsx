'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';

export default function DarkMode3DTransition() {
  const { isDark, trigger3DTransition, clear3DTransition } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger3DTransition) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      clear3DTransition();
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    let renderer: THREE.WebGLRenderer | null = null;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clear3DTransition();
    };

    canvas.addEventListener('webglcontextlost', onContextLost);

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 50;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      // Particle field & shockwave ring
      const particleCount = 200;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

        // Radial blast outward
        const angle = Math.random() * Math.PI * 2;
        const speed = 25 + Math.random() * 45;
        velocities[i * 3] = Math.cos(angle) * speed;
        velocities[i * 3 + 1] = Math.sin(angle) * speed;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 15;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Colors: Golden/Amber for Day, Silver/Cyan/Moss for Night
      const mainColor = isDark ? 0x93c5fd : 0xf59e0b;
      const secondaryColor = isDark ? 0x86efac : 0xfde047;

      const particleMat = new THREE.PointsMaterial({
        color: mainColor,
        size: 2.2,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // 3D Expanding Shockwave Torus
      const shockwaveGeo = new THREE.TorusGeometry(2, 0.4, 16, 64);
      const shockwaveMat = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        transparent: true,
        opacity: 0.8,
        wireframe: true,
        blending: THREE.AdditiveBlending,
      });
      const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
      scene.add(shockwave);

      const startTime = performance.now();
      const duration = 850; // ms

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.0);

        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        // Expand shockwave
        const scale = 1 + ease * 40;
        shockwave.scale.set(scale, scale, scale);
        shockwave.rotation.z += 0.04;
        shockwave.rotation.x = Math.PI / 6;
        shockwaveMat.opacity = (1 - progress) * 0.7;

        // Move particles
        const pos = particleGeo.attributes.position;
        for (let i = 0; i < particleCount; i++) {
          const dt = 0.016;
          positions[i * 3] += velocities[i * 3] * dt;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
        }
        pos.needsUpdate = true;
        particleMat.opacity = (1 - progress) * 0.85;

        renderer!.render(scene, camera);

        if (progress < 1.0) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          clear3DTransition();
          renderer?.dispose();
          particleGeo.dispose();
          particleMat.dispose();
          shockwaveGeo.dispose();
          shockwaveMat.dispose();
        }
      };

      animRef.current = requestAnimationFrame(animate);
    } catch {
      clear3DTransition();
    }

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer?.dispose();
    };
  }, [trigger3DTransition, isDark, clear3DTransition]);

  if (!trigger3DTransition) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
