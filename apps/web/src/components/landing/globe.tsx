"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

interface GlobeProps {
  /** Radians per frame around the Y axis. */
  rotationSpeed?: number;
  /** Sphere radius in world units. */
  radius?: number;
  /** Number of dots scattered across the surface. */
  dotCount?: number;
}

/** Reads a landing color token to hex so three.js can consume it. */
function readToken(token: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value || fallback;
}

/**
 * Even point distribution over a sphere via the Fibonacci lattice, so dots
 * never clump at the poles the way naive lat/long sampling does.
 */
function useSpherePoints(count: number, radius: number): Float32Array {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ringRadius = Math.sqrt(1 - y * y);
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * ringRadius * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * ringRadius * radius;
    }
    return positions;
  }, [count, radius]);
}

function GlobeMesh({
  rotationSpeed,
  radius,
  dotCount,
  animate,
}: Required<GlobeProps> & { animate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const positions = useSpherePoints(dotCount, radius);
  const accent = useMemo(() => readToken("--lp-accent", "#1e3a8a"), []);
  const line = useMemo(() => readToken("--lp-line-strong", "#c7bca8"), []);

  useFrame(() => {
    if (!animate || !groupRef.current) return;
    groupRef.current.rotation.y += rotationSpeed;
    groupRef.current.rotation.x += rotationSpeed * 0.15;
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0, 0.1]}>
      {/* Faint wireframe shell for structure. */}
      <mesh>
        <sphereGeometry args={[radius * 0.985, 36, 36]} />
        <meshBasicMaterial color={line} transparent opacity={0.22} wireframe />
      </mesh>
      {/* Branded surface dots. */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={accent}
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.9}
        />
      </points>
    </group>
  );
}

/**
 * Ambient dot-globe rendered behind the hero. Colors come from the landing
 * tokens (`--lp-accent`, `--lp-line-strong`) so the mark restyles with the
 * page. Rotation halts entirely under reduced-motion.
 */
export function Globe({
  rotationSpeed = 0.0016,
  radius = 1,
  dotCount = 1400,
}: GlobeProps) {
  const reduce = useReducedMotion();

  return (
    <Canvas
      className="absolute! inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3], fov: 70 }}
      gl={{ antialias: true, alpha: true }}
    >
      <GlobeMesh
        rotationSpeed={rotationSpeed}
        radius={radius}
        dotCount={dotCount}
        animate={!reduce}
      />
    </Canvas>
  );
}
