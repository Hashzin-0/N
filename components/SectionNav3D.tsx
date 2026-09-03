'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';
import { useScrollSpy } from '@/hooks/useScrollSpy';

interface SectionConfig {
  id: string;
  label: string;
  shortLabel: string;
  geometry: 'dodecahedron' | 'box' | 'octahedron' | 'torusknot' | 'icosahedron' | 'cone' | 'torus' | 'sphere' | 'cylinder';
  color: string;
  colorDark: string;
}

const NITROGEN_SECTIONS: SectionConfig[] = [
  { id: 'preset_selector', label: 'Cenários', shortLabel: 'Cen.', geometry: 'dodecahedron', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'form_section', label: 'Parâmetros', shortLabel: 'Param.', geometry: 'box', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'results_section', label: 'Resultados', shortLabel: 'Res.', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
  { id: 'parceling_section', label: 'Parcelamento', shortLabel: 'Parc.', geometry: 'torusknot', color: '#D4A373', colorDark: '#D4A373' },
  { id: 'detailed_math_panel', label: 'Fórmulas', shortLabel: 'Fórm.', geometry: 'icosahedron', color: '#8D6E63', colorDark: '#CBB5A1' },
];

const CORN_SECTIONS: SectionConfig[] = [
  { id: 'corn_yield_header', label: 'Visão Geral', shortLabel: 'Visão', geometry: 'sphere', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_params', label: 'Parâmetros', shortLabel: 'Param.', geometry: 'cylinder', color: '#5A5A40', colorDark: '#9CB386' },
  { id: 'corn_yield_alerts', label: 'Alertas', shortLabel: 'Alert.', geometry: 'cone', color: '#D4A373', colorDark: '#E0A96D' },
  { id: 'corn_yield_visual', label: 'Visual 3D', shortLabel: '3D', geometry: 'torus', color: '#C19262', colorDark: '#D4A373' },
  { id: 'corn_yield_results', label: 'Resultados', shortLabel: 'Res.', geometry: 'octahedron', color: '#2E6F40', colorDark: '#86efac' },
];

const COMPARATOR_SECTIONS: SectionConfig[] = [
  { id: 'scenario_comparator_section', label: 'Comparador', shortLabel: 'Comp.', geometry: 'box', color: '#5A5A40', colorDark: '#9CB386' },
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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const ringRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number | null>(null);
  const isActiveRef = useRef(isActive);
  const isHoveredRef = useRef(isHovered);
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 48;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 3.2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(2, 3, 4);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0xa5c9eb, 0.6);
    back.position.set(-2, -1, -3);
    scene.add(back);

    const colorHex = parseInt((isDark ? config.colorDark : config.color).replace('#', ''), 16);
    const geo = createGeometry(config.geometry);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.15,
      roughness: 0.35,
      metalness: 0.25,
      wireframe: config.geometry === 'box',
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    meshRef.current = mesh;

    // Active ring
    const ringGeo = new THREE.TorusGeometry(1.5, 0.06, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    scene.add(ring);
    ringRef.current = ring;

    const clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const speed = isHoveredRef.current ? 0.025 : 0.006;
      mesh.rotation.y += speed;
      mesh.rotation.x += speed * 0.4;

      targetScale.current = isActiveRef.current ? 1.2 : isHoveredRef.current ? 1.1 : 1.0;
      currentScale.current += (targetScale.current - currentScale.current) * 0.12;
      mesh.scale.setScalar(currentScale.current);

      mat.emissiveIntensity = isActiveRef.current ? 0.4 + Math.sin(elapsed * 3) * 0.15 : 0.15;

      ringMat.opacity = isActiveRef.current ? 0.35 + Math.sin(elapsed * 2.5) * 0.15 : 0;
      ring.rotation.z = elapsed * 0.5;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [config.geometry, config.color, config.colorDark, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="w-8 h-8 rounded-full pointer-events-none"
      style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(156,187,134,0.5))' : 'none' }}
    />
  );
}

/* ─── Transition Particles Canvas ─── */
function TransitionEffect({
  active,
  fromSections,
  toSections,
  isDark,
  onComplete,
}: {
  active: boolean;
  fromSections: SectionConfig[];
  toSections: SectionConfig[];
  isDark: boolean;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) { onComplete(); return; }

    const navBar = canvas.parentElement;
    const width = navBar?.clientWidth || 600;
    const height = 56;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const fromColor = isDark ? new THREE.Color(0x9CB386) : new THREE.Color(0x5A5A40);
    const toColor = isDark ? new THREE.Color(0xD4A373) : new THREE.Color(0xC19262);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 15;
      positions[i * 3] = (Math.random() - 0.5) * width * 0.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * height * 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      velocities[i * 3] = Math.cos(angle) * radius;
      velocities[i * 3 + 1] = Math.sin(angle) * radius;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const mixFactor = i / particleCount;
      const c = fromColor.clone().lerp(toColor, mixFactor);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.0,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const ringGeo = new THREE.TorusGeometry(3, 0.3, 12, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xD4A373 : 0x5A5A40,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    const startTime = performance.now();
    const duration = 700;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      const pos = geo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const dt = 0.016;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3] += velocities[i * 3] * dt * (1 - ease * 0.5);
        arr[i * 3 + 1] += velocities[i * 3 + 1] * dt * (1 - ease * 0.5);
        arr[i * 3 + 2] += velocities[i * 3 + 2] * dt;
      }
      pos.needsUpdate = true;

      const scale = 1 + ease * 8;
      ring.scale.set(scale, scale, scale);
      ring.rotation.z += 0.03;
      ring.rotation.x = Math.PI / 4;
      ringMat.opacity = (1 - progress) * 0.5;

      mat.opacity = (1 - progress) * 0.85;

      renderer.render(scene, camera);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
        renderer.dispose();
        geo.dispose();
        mat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [active, isDark, onComplete]);

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
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const prevTabRef = useRef(activeTab);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleClick = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onNavigate?.(sectionId);
    }
  }, [onNavigate]);

  // Transition effect when tab changes
  const [fromSections, setFromSections] = React.useState<SectionConfig[]>(NITROGEN_SECTIONS);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setFromSections(prevTabRef.current === 'estimativa_milho'
        ? CORN_SECTIONS
        : prevTabRef.current === 'comparador'
          ? COMPARATOR_SECTIONS
          : NITROGEN_SECTIONS
      );
      setIsTransitioning(true);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1 px-2 py-1 rounded-xl bg-white/60 dark:bg-[#1C201A]/60 border border-[#E5E2D9] dark:border-[#2C3328] backdrop-blur-sm overflow-hidden"
      role="tablist"
      aria-label="Navegação de seções"
    >
      <TransitionEffect
        active={isTransitioning}
        fromSections={fromSections}
        toSections={sections}
        isDark={isDark}
        onComplete={handleTransitionComplete}
      />

      {sections.map((config) => {
        const isActive = currentSection === config.id;
        const isHovered = hoveredId === config.id;

        return (
          <button
            key={config.id}
            role="tab"
            aria-selected={isActive}
            aria-label={config.label}
            title={config.label}
            onClick={() => handleClick(config.id)}
            onMouseEnter={() => setHoveredId(config.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-300 select-none group ${
              isActive
                ? 'bg-[#5A5A40]/10 dark:bg-[#9CB386]/10 shadow-sm'
                : 'hover:bg-[#F0EDE5] dark:hover:bg-[#232821]'
            }`}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <NavIcon3D
                config={config}
                isActive={isActive}
                isHovered={isHovered}
                isDark={isDark}
              />
            </div>
            <span className={`hidden sm:block text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
              isActive
                ? 'text-[#5A5A40] dark:text-[#9CB386]'
                : 'text-[#8C897E] dark:text-[#9EA399] group-hover:text-[#5A5A40] dark:group-hover:text-[#E8E6DF]'
            }`}>
              {config.shortLabel}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4A373] animate-pulse" />
            )}
          </button>
        );
      })}

      {/* Scroll Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5E2D9] dark:bg-[#2C3328]">
        <ScrollProgress sections={sectionIds} />
      </div>
    </div>
  );
}

/* ─── Scroll Progress Indicator ─── */
function ScrollProgress({ sections }: { sections: string[] }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      if (sections.length === 0) return;
      const firstEl = document.getElementById(sections[0]);
      const lastEl = document.getElementById(sections[sections.length - 1]);
      if (!firstEl || !lastEl) return;

      const firstTop = firstEl.getBoundingClientRect().top + window.scrollY;
      const lastBottom = lastEl.getBoundingClientRect().bottom + window.scrollY;
      const totalHeight = lastBottom - firstTop;
      if (totalHeight <= 0) return;

      const scrolled = window.scrollY - firstTop + window.innerHeight * 0.5;
      const pct = Math.max(0, Math.min(1, scrolled / totalHeight));
      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div
      className="h-full bg-gradient-to-r from-[#5A5A40] via-[#D4A373] to-[#8D6E63] dark:from-[#9CB386] dark:via-[#D4A373] dark:to-[#CBB5A1] transition-all duration-150 ease-out"
      style={{ width: `${progress * 100}%` }}
    />
  );
}
