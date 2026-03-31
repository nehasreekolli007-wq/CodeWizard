// 3D Dark Lord — the final boss character built from Three.js primitives
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

// Dissolve/death particle explosion
function DeathBurst() {
  const ref = useRef();
  const pos = new Float32Array(
    Array.from({ length: 300 }, () => (Math.random() - 0.5) * 6)
  );
  const vel = Array.from({ length: 100 }, () => ({
    x: (Math.random() - 0.5) * 0.04,
    y: Math.random() * 0.06 + 0.01,
    z: (Math.random() - 0.5) * 0.04,
  }));

  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < vel.length; i++) {
      arr[i * 3]     += vel[i].x;
      arr[i * 3 + 1] += vel[i].y;
      arr[i * 3 + 2] += vel[i].z;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    if (ref.current.material) ref.current.material.opacity -= 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#c0392b" size={0.12} transparent opacity={1} />
    </points>
  );
}

export default function DarkLord({ phase = 'alive', scale = 1, position = [0, 0, 0] }) {
  const rootRef  = useRef();
  const capeRef  = useRef();
  const orbRef   = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!rootRef.current || phase !== 'alive') return;

    // Slow ominous hover
    rootRef.current.position.y = (position[1] || 0) + Math.sin(t * 0.7) * 0.18;
    // Slow rotation to face player
    rootRef.current.rotation.y = Math.sin(t * 0.3) * 0.15;

    if (capeRef.current) {
      capeRef.current.rotation.z = Math.sin(t * 0.8) * 0.06;
    }
    if (orbRef.current) {
      orbRef.current.rotation.y += 0.02;
    }
  });

  if (phase === 'dead') return <DeathBurst />;

  return (
    <group ref={rootRef} position={position} scale={scale}>
      {/* ══ DARK ROBE / BODY — tall & imposing ══ */}
      {/* Lower robe sweep */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.6, 10]} />
        <meshStandardMaterial color="#0d0606" roughness={0.95} emissive="#1a0000" emissiveIntensity={0.2} />
      </mesh>
      {/* Main body */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.42, 0.64, 1.8, 10]} />
        <meshStandardMaterial color="#0d0606" roughness={0.9} emissive="#200000" emissiveIntensity={0.25} />
      </mesh>
      {/* Upper chest plate */}
      <mesh position={[0, 0.9, 0.1]}>
        <boxGeometry args={[0.72, 0.6, 0.12]} />
        <meshStandardMaterial color="#1a0808" roughness={0.8} metalness={0.4} emissive="#300000" emissiveIntensity={0.2} />
      </mesh>

      {/* ══ CAPE ══ */}
      <group ref={capeRef}>
        <mesh position={[0, 0.4, -0.25]}>
          <cylinderGeometry args={[0.5, 0.85, 2.0, 8, 1, true]} />
          <meshStandardMaterial color="#0a0303" roughness={1} side={2} />
        </mesh>
      </group>

      {/* ══ NECK ══ */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.22, 8]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.9} />
      </mesh>

      {/* ══ HEAD ══ */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial color="#1a0808" roughness={0.85} emissive="#2a0000" emissiveIntensity={0.4} />
      </mesh>

      {/* Jaw extension — skull-like */}
      <mesh position={[0, 1.56, 0.12]}>
        <boxGeometry args={[0.28, 0.16, 0.2]} />
        <meshStandardMaterial color="#160606" roughness={0.9} />
      </mesh>

      {/* ══ GLOWING RED EYES ══ */}
      {[0.12, -0.12].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.74, 0.26]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color="#ff1a00" emissive="#ff1a00" emissiveIntensity={4} />
          </mesh>
          {/* Inner eye glow */}
          <mesh position={[x, 1.74, 0.28]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 1.74, 0.3]} color="#ff2200" intensity={3} distance={4} />

      {/* ══ CROWN OF THORNS ══ */}
      {Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(angle) * 0.29, 1.95, Math.cos(angle) * 0.29]}>
            <coneGeometry args={[0.035, 0.22, 4]} />
            <meshStandardMaterial color="#6b0000" emissive="#8b0000" emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}

      {/* ══ ARMS ══ */}
      {/* Left arm — outstretched menacingly */}
      <group position={[-0.52, 0.9, 0]} rotation={[0, 0, -0.5]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.08, 0.8, 6]} />
          <meshStandardMaterial color="#0d0606" roughness={0.9} />
        </mesh>
        {/* Clawed hand */}
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#1a0a0a" roughness={0.85} />
        </mesh>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={i} position={[
            Math.sin(i * 1.2) * 0.09,
            -0.64,
            Math.cos(i * 1.2) * 0.09,
          ]}>
            <coneGeometry args={[0.018, 0.14, 4]} />
            <meshStandardMaterial color="#400000" emissive="#600000" emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* Right arm — holds dark orb */}
      <group position={[0.52, 0.9, 0]} rotation={[0, 0, 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.08, 0.8, 6]} />
          <meshStandardMaterial color="#0d0606" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#1a0a0a" roughness={0.85} />
        </mesh>

        {/* Dark orb in palm */}
        <group ref={orbRef} position={[0, -0.7, 0]}>
          <Float speed={3} floatIntensity={0.3}>
            <mesh>
              <sphereGeometry args={[0.14, 14, 14]} />
              <meshStandardMaterial
                color="#1a0000" emissive="#8b0000" emissiveIntensity={2.5}
                transparent opacity={0.85}
              />
            </mesh>
            {/* Inner void */}
            <mesh>
              <sphereGeometry args={[0.09, 10, 10]} />
              <meshStandardMaterial color="#000000" emissive="#200000" emissiveIntensity={1} />
            </mesh>
            <pointLight color="#c0392b" intensity={2} distance={2.5} />
          </Float>
        </group>
      </group>

      {/* ══ FLOATING DARK SHARDS ══ */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const r = 1.1;
        return (
          <Float key={i} speed={1.2 + i * 0.3} floatIntensity={0.4} rotationIntensity={0.8}>
            <mesh position={[Math.sin(angle) * r, 0.2 + i * 0.15, Math.cos(angle) * r]}>
              <tetrahedronGeometry args={[0.12]} />
              <meshStandardMaterial color="#1a0000" emissive="#8b0000" emissiveIntensity={0.7} />
            </mesh>
          </Float>
        );
      })}

      {/* ══ AMBIENT DARK AURA ══ */}
      <pointLight color="#8b0000" intensity={2} distance={5} />
      <pointLight position={[0, -0.5, 0]} color="#3d0000" intensity={1.5} distance={4} />
    </group>
  );
}
