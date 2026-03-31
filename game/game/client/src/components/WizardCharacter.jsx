// 3D Wizard Character — built from Three.js primitives
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

// Robe + staff-crystal colors per archetype
const ARCHETYPE_PALETTE = {
  'chrono-mage':    { robe: '#7a5c10', robeEmissive: '#3d2e08', crystal: '#f0c040', crystalGlow: '#ffd700' },
  'storm-caller':   { robe: '#1a3a5c', robeEmissive: '#0a1a2e', crystal: '#60cfff', crystalGlow: '#0dd4f8' },
  'void-walker':    { robe: '#1a3a22', robeEmissive: '#0a1e10', crystal: '#50e890', crystalGlow: '#2ecc71' },
  'nature-shaman':  { robe: '#3d2810', robeEmissive: '#1e1408', crystal: '#a8e890', crystalGlow: '#6abf69' },
};

export default function WizardCharacter({
  gender = 'male',
  archetype = 'void-walker',
  scale = 1,
  walking = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  castingSpell = false,
}) {
  const rootRef   = useRef();
  const staffRef  = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  const pal = ARCHETYPE_PALETTE[archetype] || ARCHETYPE_PALETTE['void-walker'];
  const isFemale = gender === 'female';
  const skinTone = isFemale ? '#e8c5a0' : '#d4966a';
  const hairColor = isFemale ? '#3d1a08' : '#5c3d18';

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!rootRef.current) return;

    if (castingSpell) {
      // Raise staff dramatically
      if (staffRef.current) staffRef.current.rotation.z = -0.6 + Math.sin(t * 8) * 0.05;
      rootRef.current.position.y = Math.sin(t * 3) * 0.06;
    } else if (walking) {
      // Walking bob + arm swing
      rootRef.current.position.y = Math.abs(Math.sin(t * 6)) * 0.07;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  =  Math.sin(t * 6) * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 6) * 0.4;
      if (staffRef.current)    staffRef.current.rotation.z    =  Math.sin(t * 3) * 0.08;
    } else {
      // Idle gentle float
      rootRef.current.position.y = Math.sin(t * 1.4) * 0.04;
      if (staffRef.current) staffRef.current.rotation.z = Math.sin(t * 1.2) * 0.06;
    }
  });

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      {/* ── ROBE / BODY ── */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[isFemale ? 0.26 : 0.22, isFemale ? 0.38 : 0.34, 1.3, 8]} />
        <meshStandardMaterial color={pal.robe} emissive={pal.robeEmissive} roughness={0.85} />
      </mesh>

      {/* Robe lower flare */}
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[isFemale ? 0.44 : 0.40, isFemale ? 0.32 : 0.28, 0.3, 8]} />
        <meshStandardMaterial color={pal.robe} emissive={pal.robeEmissive} roughness={0.9} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.235, 0.235, 0.07, 12]} />
        <meshStandardMaterial color="#b5922a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── NECK ── */}
      <mesh position={[0, 0.73, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.18, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.8} />
      </mesh>

      {/* ── HEAD ── */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color={skinTone} roughness={0.7} />
      </mesh>

      {/* Eyes */}
      {[0.085, -0.085].map((x, i) => (
        <mesh key={i} position={[x, 0.94, 0.19]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1a0e05" />
        </mesh>
      ))}

      {/* Male beard */}
      {!isFemale && (
        <mesh position={[0, 0.77, 0.15]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color={hairColor} roughness={1} />
        </mesh>
      )}

      {/* Female hair buns */}
      {isFemale && (
        <>
          {[0.18, -0.18].map((x, i) => (
            <mesh key={i} position={[x, 0.92, -0.1]}>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial color={hairColor} roughness={1} />
            </mesh>
          ))}
          {/* Hair fringe */}
          <mesh position={[0, 0.92, 0.15]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={hairColor} roughness={1} />
          </mesh>
        </>
      )}

      {/* ── WIZARD HAT ── */}
      {/* Brim */}
      <mesh position={[0, 1.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.07, 6, 16]} />
        <meshStandardMaterial color="#151a10" roughness={0.95} />
      </mesh>
      {/* Cone */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.22, 0.8, 8]} />
        <meshStandardMaterial color="#1b2514" roughness={0.9} />
      </mesh>
      {/* Hat star emblem */}
      <mesh position={[0, 1.18, 0.17]}>
        <octahedronGeometry args={[0.04]} />
        <meshStandardMaterial color={pal.crystalGlow} emissive={pal.crystalGlow} emissiveIntensity={1.2} />
      </mesh>

      {/* ── SHOULDERS / ARMS ── */}
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.28, 0.45, 0]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.065, 0.5, 6]} />
          <meshStandardMaterial color={pal.robe} roughness={0.85} />
        </mesh>
        {/* Left hand */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
      </group>

      {/* Right arm + STAFF */}
      <group ref={rightArmRef} position={[0.28, 0.45, 0]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.065, 0.5, 6]} />
          <meshStandardMaterial color={pal.robe} roughness={0.85} />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>

        {/* Staff */}
        <group ref={staffRef} position={[0.1, -0.25, 0]}>
          {/* Shaft */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.022, 0.028, 1.5, 6]} />
            <meshStandardMaterial color="#4a2e0a" roughness={0.95} />
          </mesh>
          {/* Gnarled knot at grip */}
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#3d2508" roughness={1} />
          </mesh>
          {/* Crystal orb top */}
          <mesh position={[0, 1.12, 0]}>
            <octahedronGeometry args={[0.1, 1]} />
            <meshStandardMaterial
              color={pal.crystal}
              emissive={pal.crystalGlow}
              emissiveIntensity={castingSpell ? 3 : 1.5}
              transparent opacity={0.92}
            />
          </mesh>
          <pointLight
            position={[0, 1.12, 0]}
            color={pal.crystalGlow}
            intensity={castingSpell ? 2.5 : 0.8}
            distance={3}
          />
        </group>
      </group>
    </group>
  );
}
