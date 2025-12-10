import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Memory, MemoryType, AtmosphereState, HolidayMode, AureliaSkin } from '../types';

interface ButterflySceneProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
  onBackgroundClick: () => void;
  isFocusMode: boolean;
  searchTerm: string;
  atmosphere: AtmosphereState;
  voiceEnergy: number; // 0.0 to 1.0, derived from Mic
  holidayMode: HolidayMode;
  aureliaSkin: AureliaSkin;
}

const ButterflyScene: React.FC<ButterflySceneProps> = ({ 
  memories, 
  onMemoryClick, 
  onBackgroundClick,
  isFocusMode,
  searchTerm,
  atmosphere,
  voiceEnergy,
  holidayMode,
  aureliaSkin
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const butterflyGroupRef = useRef<THREE.Group | null>(null);
  const leftWingRef = useRef<THREE.Group | null>(null);
  const rightWingRef = useRef<THREE.Group | null>(null);
  const memoryObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

  // Refs for animation
  const timeRef = useRef(0);
  const dustRef = useRef<THREE.Points | null>(null);
  const bodyRef = useRef<THREE.Group | null>(null);
  const headRef = useRef<THREE.Mesh | THREE.Points | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Initialization
  useEffect(() => {
    if (!containerRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    // Initial Fog
    scene.fog = new THREE.FogExp2(new THREE.Color(atmosphere.fogColor), atmosphere.fogDensity);
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 45);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 80;
    controls.minDistance = 5;
    controls.maxPolarAngle = Math.PI / 1.5; 
    controlsRef.current = controls;

    // POST-PROCESSING (BLOOM)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = atmosphere.bloomStrength; 
    bloomPass.radius = 0.8;
    bloomPassRef.current = bloomPass;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // --- GEOMETRY GENERATION ---

    const butterflyGroup = new THREE.Group();
    butterflyGroupRef.current = butterflyGroup;
    scene.add(butterflyGroup);

    // Function to create vein-like particles along butterfly curve
    const createWingVeins = (isRight: boolean) => {
      const geometry = new THREE.BufferGeometry();
      const count = 4000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      const colorStart = isRight ? new THREE.Color(0x00BFFF) : new THREE.Color(0xFFAA00); 
      const colorEnd = isRight ? new THREE.Color(0x9932CC) : new THREE.Color(0xFF4500);

      for (let i = 0; i < count; i++) {
        const t = Math.random() * Math.PI * 2; 
        
        // Parametric curve
        const r = (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5));
        
        let x = Math.sin(t) * r * 8; 
        let y = Math.cos(t) * r * 8;

        x = Math.abs(x) * (isRight ? 1 : -1);

        const dist = Math.sqrt(x*x + y*y);
        const z = (Math.random() - 0.5) * (4 - dist * 0.1); 

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Colors
        const mixedColor = colorStart.clone().lerp(colorEnd, (y + 10) / 20 + Math.random() * 0.2);
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;

        sizes[i] = Math.random() * 0.3 + 0.05;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.4,
      });

      return new THREE.Points(geometry, material);
    };

    // Wings Containers
    const leftWingGroup = new THREE.Group();
    const rightWingGroup = new THREE.Group();
    
    // Add Particle Veins
    const leftVeins = createWingVeins(false);
    const rightVeins = createWingVeins(true);
    
    leftWingGroup.add(leftVeins);
    rightWingGroup.add(rightVeins);

    leftWingRef.current = leftWingGroup;
    rightWingRef.current = rightWingGroup;

    butterflyGroup.add(leftWingGroup);
    butterflyGroup.add(rightWingGroup);

    // --- CRYSTAL BODY (Spine) ---
    const bodyGroup = new THREE.Group();
    bodyRef.current = bodyGroup;
    
    // Core spine
    const spineGeo = new THREE.CylinderGeometry(0.3, 0.1, 18, 6);
    const spineMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      emissive: 0x002244,
      roughness: 0.2,
      metalness: 0.8,
      transmission: 0.5,
      thickness: 1
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    bodyGroup.add(spine);

    // Floating rings/ribs
    for(let i=0; i<8; i++) {
        const ringGeo = new THREE.TorusGeometry(0.4 + i*0.05, 0.05, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.6 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -6 + i * 1.5;
        bodyGroup.add(ring);
    }
    butterflyGroup.add(bodyGroup);

    // --- MIRROR LAKE (Head) ---
    // Placeholder, real geometry created in effect hook below based on skin
    
    // Head Halo
    const haloGeo = new THREE.RingGeometry(1.6, 1.8, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 10;
    butterflyGroup.add(halo);


    // --- AMBIENT DUST ---
    const dustCount = 1500;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for(let i=0; i<dustCount*3; i+=3) {
        dustPos[i] = (Math.random() - 0.5) * 60;
        dustPos[i+1] = (Math.random() - 0.5) * 40;
        dustPos[i+2] = (Math.random() - 0.5) * 40;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true, 
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dustRef.current = dust;
    scene.add(dust);

    // --- ABYSS (Bottom) ---
    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI/2;
    plane.position.y = -20;
    scene.add(plane);


    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(atmosphere.ambientLightColor, 1.0);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xffffff, 2, 100);
    mainLight.position.set(0, 20, 20);
    scene.add(mainLight);

    const pulseLight = new THREE.PointLight(0x88ccff, 0, 30);
    pulseLight.position.set(0, 0, 0);
    scene.add(pulseLight);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      timeRef.current += delta;
      const t = timeRef.current;
      
      // Butterfly Float
      if(butterflyGroupRef.current) {
          butterflyGroupRef.current.position.y = Math.sin(t * 0.5) * 1.5;
      }

      // Voice Resonance Logic
      // Add voice energy to the flap and pulse calculations
      const voiceAmp = Math.max(0, voiceEnergy * 3); // Amplify voice for effect
      
      // Wing Flap
      const flapSpeed = 0.8 + (voiceAmp * 2); // Flap faster when talking
      const flapAmp = 0.3 + (voiceAmp * 0.2);
      const flap = Math.sin(t * flapSpeed) * flapAmp;
      
      if (leftWingRef.current) {
        leftWingRef.current.rotation.z = flap; 
        leftWingRef.current.rotation.y = -flap * 0.3;
      }
      if (rightWingRef.current) {
        rightWingRef.current.rotation.z = -flap;
        rightWingRef.current.rotation.y = flap * 0.3;
      }

      // Dust Motion
      if (dustRef.current) {
          dustRef.current.rotation.y = t * 0.02 + (voiceAmp * 0.05);
      }

      // Pulse Heartbeat & Head Resonance
      pulseLight.intensity = 1 + Math.sin(t * 3) * 0.5 + voiceAmp;
      if (bodyRef.current) {
          // Voice causes the body spine to pulse noticeably
          bodyRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.02 + (voiceAmp * 0.1));
      }

      // Mirror Lake Resonance (Head)
      if (headRef.current) {
         // Distort head scale slightly based on voice to simulate fluid ripple
         const ripple = Math.sin(t * 10) * voiceAmp * 0.1;
         headRef.current.scale.set(1 + ripple, 0.3 + ripple, 1 + ripple);
         
         if (headRef.current instanceof THREE.Mesh) {
            (headRef.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = voiceAmp * 2;
            (headRef.current.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0x88ccff);
         }
      }
      
      controls.update();
      composer.render();
    };

    animate();

    // Event Listeners
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // --- HANDLE AURELIA SKINS ---
  useEffect(() => {
    if (!butterflyGroupRef.current) return;

    // Remove old head if exists
    if (headRef.current) {
        butterflyGroupRef.current.remove(headRef.current);
        if (headRef.current instanceof THREE.Mesh) {
            headRef.current.geometry.dispose();
            (headRef.current.material as THREE.Material).dispose();
        }
        headRef.current = null;
    }

    if (aureliaSkin === AureliaSkin.STARLIGHT) {
        // Star Particle Head
        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const count = geometry.attributes.position.count;
        const colors = new Float32Array(count * 3);
        for(let i=0; i<count*3; i+=3) {
            colors[i] = 0.6; // R
            colors[i+1] = 0.8; // G
            colors[i+2] = 1.0; // B
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        const points = new THREE.Points(geometry, material);
        points.position.y = 10;
        points.scale.set(1, 0.3, 1);
        points.userData = { isHead: true };
        headRef.current = points;
        butterflyGroupRef.current.add(points);
    } else {
        // Default Mirror Head
        const headGeo = new THREE.SphereGeometry(1.5, 64, 64);
        headGeo.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.3, 1));
        const headMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0,
            metalness: 1.0,
            envMapIntensity: 2.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 10;
        head.userData = { isHead: true };
        headRef.current = head;
        butterflyGroupRef.current.add(head);
    }

  }, [aureliaSkin]);

  // --- HANDLE HOLIDAY ATMOSPHERE ---
  useEffect(() => {
      if (!sceneRef.current) return;
      
      let targetFogColor = atmosphere.fogColor;
      let targetAmbient = atmosphere.ambientLightColor;

      if (holidayMode === HolidayMode.WINTER_SOLSTICE) {
          targetFogColor = '#000022'; // Deep blue
          targetAmbient = '#331100'; // Warm orange underglow
      } else if (holidayMode === HolidayMode.BIRTHDAY) {
          targetFogColor = '#110011'; // Festive purple
          targetAmbient = '#332244';
      }

      // Apply
      const fog = sceneRef.current.fog as THREE.FogExp2;
      if (fog) {
          fog.color.set(targetFogColor);
          fog.density = holidayMode === HolidayMode.WINTER_SOLSTICE ? 0.02 : atmosphere.fogDensity;
      }
      if (ambientLightRef.current) {
          ambientLightRef.current.color.set(targetAmbient);
      }

  }, [holidayMode, atmosphere]);

  // --- MEMORY SYNC LOGIC ---
  useEffect(() => {
    if (!leftWingRef.current || !rightWingRef.current) return;

    const realGeo = new THREE.IcosahedronGeometry(0.3, 0); 
    const dreamGeo = new THREE.SphereGeometry(0.3, 32, 32); 

    const realMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0xff4400,
        emissiveIntensity: 0.5
    });

    const dreamMat = new THREE.MeshPhysicalMaterial({
        color: 0x4488ff,
        roughness: 0,
        metalness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        clearcoat: 1,
        ior: 1.5,
        iridescence: 0.6
    });

    // Special Holiday Material Override
    if (holidayMode === HolidayMode.WINTER_SOLSTICE) {
        realMat.emissive.setHex(0xff2200); // More embers
    } else if (holidayMode === HolidayMode.BIRTHDAY) {
        // Bright candle look
        realMat.emissiveIntensity = 2.0;
    }

    memories.forEach(mem => {
      let mesh = memoryObjectsRef.current.get(mem.id);
      
      // Create if new
      if (!mesh) {
        const isDream = mem.type === MemoryType.DREAM;
        
        const mat = isDream ? dreamMat.clone() : realMat.clone();
        
        mesh = new THREE.Mesh(isDream ? dreamGeo : realGeo, mat);
        mesh.position.set(mem.position[0], mem.position[1], mem.position[2]);
        mesh.userData = { id: mem.id, isMemory: true, originalScale: 1, originalColor: isDream ? 0x4488ff : 0xffaa00 };

        if (isDream) {
            rightWingRef.current?.add(mesh);
        } else {
            leftWingRef.current?.add(mesh);
        }
        memoryObjectsRef.current.set(mem.id, mesh);
      }

      // Update Visuals based on Search/Interaction AND Sculpting
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
        
        // Apply Sculpted Visuals
        if (mem.visuals?.customColor) {
            mat.color.set(mem.visuals.customColor);
            if (mat instanceof THREE.MeshStandardMaterial) mat.emissive.set(mem.visuals.customColor);
        }

        const aura = mem.visuals?.auraIntensity || 1;
        
        // Search & Focus Logic
        const isMatch = searchTerm === '' || mem.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())) || mem.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (isMatch) {
            const baseScale = mem.visuals?.scale || 1.5;
            mesh.scale.setScalar(baseScale);
            mat.opacity = 1;
            mat.transparent = false;
            if (mat instanceof THREE.MeshStandardMaterial) mat.emissiveIntensity = 2.0 * aura;
        } else {
            mesh.scale.setScalar(0.5);
            mat.opacity = 0.2;
            mat.transparent = true;
            if (mat instanceof THREE.MeshStandardMaterial) mat.emissiveIntensity = 0;
        }
      }
    });

  }, [memories, searchTerm, holidayMode]);

  // Click Handler
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
        if (!cameraRef.current || !sceneRef.current) return;

        mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, cameraRef.current);
        
        const objectsToCheck: THREE.Object3D[] = [];
        if (leftWingRef.current) objectsToCheck.push(leftWingRef.current);
        if (rightWingRef.current) objectsToCheck.push(rightWingRef.current);
        if (butterflyGroupRef.current) objectsToCheck.push(butterflyGroupRef.current);

        const intersects = raycaster.current.intersectObjects(objectsToCheck, true);

        if (intersects.length > 0) {
            const hit = intersects.find(i => i.object.userData.isMemory || i.object.userData.isHead);
            
            if (hit) {
                if (hit.object.userData.isMemory) {
                    const mem = memories.find(m => m.id === hit.object.userData.id);
                    if (mem) onMemoryClick(mem);
                } else if (hit.object.userData.isHead) {
                    // Head clicked
                }
            } else {
                onBackgroundClick();
            }
        } else {
            onBackgroundClick();
        }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [memories, onMemoryClick, onBackgroundClick]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />;
};

export default ButterflyScene;