'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AlertTriangle, Check, RefreshCw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AgronomicValidationIssue {
  field: string;
  label: string;
  currentValue: number | string;
  typicalRange: string;
  severity: 'warning' | 'critical';
  message: string;
  recommendedValue: number;
}

interface CornAlert3DProps {
  issues: AgronomicValidationIssue[];
  onFixAll?: () => void;
  onFixField?: (field: string, val: number) => void;
  isDark?: boolean;
}

export default function CornAlert3D({
  issues,
  onFixAll,
  onFixField,
  isDark = false,
}: CornAlert3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const earMeshRef = useRef<THREE.Group | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const hasIssues = issues.length > 0;
  const isCritical = issues.some((i) => i.severity === 'critical');

  // Three.js 3D Trembling Corn Ear
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasIssues) return;

    const width = 80;
    const height = 80;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(isCritical ? 0xef4444 : 0xf59e0b, 2.5, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    // Corn Group
    const cornGroup = new THREE.Group();
    scene.add(cornGroup);
    earMeshRef.current = cornGroup;

    // Cob Core
    const cobGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.2, 16);
    const cobMat = new THREE.MeshStandardMaterial({
      color: isCritical ? 0xef4444 : 0xf59e0b,
      roughness: 0.4,
      metalness: 0.1,
      emissive: isCritical ? 0x7f1d1d : 0x78350f,
      emissiveIntensity: 0.5,
    });
    const cobMesh = new THREE.Mesh(cobGeo, cobMat);
    cornGroup.add(cobMesh);

    // Tip Sphere
    const tipGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const tipMesh = new THREE.Mesh(tipGeo, cobMat);
    tipMesh.position.y = 1.1;
    cornGroup.add(tipMesh);

    // Kernels bump rings
    const kernelMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.3,
      metalness: 0.2,
    });
    for (let i = -0.9; i <= 0.9; i += 0.28) {
      const ringGeo = new THREE.TorusGeometry(0.42, 0.08, 6, 12);
      const ringMesh = new THREE.Mesh(ringGeo, kernelMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = i;
      cornGroup.add(ringMesh);
    }

    // Warning Aura Ring
    const haloGeo = new THREE.RingGeometry(0.75, 0.85, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: isCritical ? 0xef4444 : 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 3;
    cornGroup.add(haloMesh);

    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (cornGroup) {
        // High frequency 3D tremor / shaking
        const intensity = isCritical ? 0.18 : 0.10;
        const speed = isCritical ? 38 : 24;

        cornGroup.rotation.z = Math.sin(elapsedTime * speed) * intensity;
        cornGroup.rotation.x = Math.cos(elapsedTime * (speed * 0.8)) * (intensity * 0.8);
        cornGroup.position.x = Math.sin(elapsedTime * (speed * 1.2)) * (intensity * 0.5);
        cornGroup.position.y = Math.cos(elapsedTime * (speed * 1.1)) * (intensity * 0.4);

        // Spin slowly on Y
        cornGroup.rotation.y += 0.02;

        // Pulse warning halo
        haloMesh.scale.setScalar(1 + Math.sin(elapsedTime * 8) * 0.15);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      cobGeo.dispose();
      cobMat.dispose();
      tipGeo.dispose();
      kernelMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
    };
  }, [hasIssues, isCritical]);

  if (!hasIssues) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`relative overflow-hidden rounded-3xl border shadow-lg transition-all ${
          isCritical
            ? isDark
              ? 'bg-[#291414] border-[#7F1D1D]/70 text-[#FCA5A5]'
              : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
            : isDark
            ? 'bg-[#261E10] border-[#854D0E]/60 text-[#FDE047]'
            : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
        }`}
        style={{
          boxShadow: isCritical
            ? '0 12px 28px -6px rgba(239, 68, 68, 0.25)'
            : '0 12px 28px -6px rgba(245, 158, 11, 0.22)',
        }}
      >
        {/* Animated Top Glow Bar */}
        <div
          className={`h-1.5 w-full ${
            isCritical
              ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-600 animate-pulse'
              : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse'
          }`}
        />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* 3D Visual + Title */}
            <div className="flex items-center gap-3.5">
              {/* 3D Canvas Box with Trembling Indicator */}
              <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-black/10 dark:bg-black/30 border border-white/20 flex items-center justify-center overflow-hidden shadow-inner">
                <canvas ref={canvasRef} className="w-16 h-16 pointer-events-none" />
                <span
                  className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-tighter shadow-md ${
                    isCritical
                      ? 'bg-red-600 text-white animate-bounce'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  3D ALERTA
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 shrink-0 ${
                      isCritical ? 'text-red-500 animate-pulse' : 'text-amber-500'
                    }`}
                  />
                  <h4 className="text-sm font-bold tracking-tight">
                    {issues.length} {issues.length === 1 ? 'Parâmetro Fora' : 'Parâmetros Fora'} do Intervalo Agronômico
                  </h4>
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  A espiga 3D detectou anomalias que distorcem a estimativa de colheita ou não refletem a prática comercial.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {onFixAll && (
                <button
                  type="button"
                  onClick={onFixAll}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-white shadow-md transition-all active:scale-95 bg-[#2E6F40] hover:bg-[#255833]"
                  style={{
                    transform: 'perspective(400px) translateZ(0)',
                  }}
                  title="Ajusta todos os parâmetros para as faixas comuns agronômicas"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Ajustar para Faixa Ideal</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors"
                title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
              >
                {isExpanded ? 'Ocultar' : 'Ver Detalhes'}
              </button>
            </div>
          </div>

          {/* DETAILED ISSUES LIST */}
          {isExpanded && (
            <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {issues.map((issue) => (
                <div
                  key={issue.field}
                  className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-3 transition-transform ${
                    issue.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/20 dark:bg-red-950/30'
                      : 'bg-amber-500/10 border-amber-500/20 dark:bg-amber-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{issue.label}:</span>
                      <span className="font-mono underline">{issue.currentValue}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        (Ideal: {issue.typicalRange})
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {issue.message}
                    </p>
                  </div>

                  {onFixField && (
                    <button
                      type="button"
                      onClick={() => onFixField(issue.field, issue.recommendedValue)}
                      className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-black/10 dark:bg-white/15 hover:bg-black/20 text-current flex items-center gap-1 transition-all active:scale-95"
                      title={`Corrigir para ${issue.recommendedValue}`}
                    >
                      <Check className="h-3 w-3" />
                      <span>{issue.recommendedValue}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
