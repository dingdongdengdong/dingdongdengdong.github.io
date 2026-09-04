import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';

const hero = document.querySelector('[data-urdf-hero]');

if (hero) {
  const stage = hero.querySelector('[data-urdf-stage]');
  const status = hero.querySelector('[data-urdf-status]');
  const toggle = hero.querySelector('[data-urdf-toggle]');
  const jointLabel = hero.querySelector('[data-urdf-joint]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let renderer;
  let controls;
  let robot;
  let frameId = 0;
  let inViewport = true;
  let motionEnabled = !reduceMotion.matches;
  let lastFrame = 0;

  const setStatus = (message, state) => {
    if (status) status.textContent = message;
    hero.dataset.urdfState = state;
  };

  const updateToggle = () => {
    if (!toggle) return;
    toggle.textContent = motionEnabled ? toggle.dataset.pauseLabel : toggle.dataset.playLabel;
    toggle.setAttribute('aria-pressed', String(!motionEnabled));
  };

  const canUseWebGL = () => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      return false;
    }
  };

  if (!stage || !canUseWebGL()) {
    setStatus(hero.dataset.fallbackLabel || 'Interactive model unavailable', 'fallback');
  } else {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 20);
    camera.position.set(0.68, 0.58, 0.72);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    renderer.domElement.className = 'urdf-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 0.38;
    controls.maxDistance = 2.2;
    controls.autoRotate = false;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x65706c, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(2.5, 4, 3);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x5577ff, 0.55);
    fillLight.position.set(-3, 1.5, -2);
    scene.add(fillLight);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.012, 64),
      new THREE.MeshStandardMaterial({ color: 0xb8bfba, roughness: 0.86, metalness: 0.02 })
    );
    platform.position.y = -0.018;
    scene.add(platform);

    const fitRobot = () => {
      const bounds = new THREE.Box3().makeEmpty();
      poses.forEach((pose) => {
        jointNames.forEach((name) => robot.joints[name]?.setJointValue(pose[name]));
        robot.updateMatrixWorld(true);
        bounds.union(new THREE.Box3().setFromObject(robot));
      });
      jointNames.forEach((name) => robot.joints[name]?.setJointValue(poses[0][name]));
      robot.updateMatrixWorld(true);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      robot.position.x -= center.x;
      robot.position.z -= center.z;
      robot.position.y -= bounds.min.y;
      platform.position.x = robot.position.x;
      platform.position.z = robot.position.z;
      const maxDimension = Math.max(size.x, size.y, size.z);
      const distance = Math.max(0.68, maxDimension * 1.8);
      camera.position.set(distance * 0.82, distance * 0.68, distance * 0.96);
      controls.target.set(0, size.y * 0.5, 0);
      controls.update();
    };

    const poses = [
      { joint1: 0.1, joint2: -0.45, joint3: 0.75, joint4: -0.5, joint5: 0.15, gripper_joint: 0.08 },
      { joint1: -0.55, joint2: 0.05, joint3: 0.35, joint4: 0.25, joint5: -0.45, gripper_joint: 0.48 },
      { joint1: 0.35, joint2: -0.65, joint3: 0.9, joint4: -0.25, joint5: 0.5, gripper_joint: 0.18 },
      { joint1: -0.15, joint2: -0.25, joint3: 0.55, joint4: 0.45, joint5: -0.15, gripper_joint: 0.52 },
    ];
    const jointNames = Object.keys(poses[0]);
    const displayJointNames = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'gripper_joint'];
    const isKorean = document.documentElement.lang.toLowerCase().startsWith('ko');
    const jointLabels = isKorean
      ? {
          joint1: 'V2 관절 1 · 베이스 요',
          joint2: 'V2 관절 2 · 숄더',
          joint3: 'V2 관절 3 · 엘보',
          joint4: 'V2 관절 4 · 손목 피치',
          joint5: 'V2 관절 5 · 손목 요',
          gripper_joint: 'STS3215 그리퍼',
        }
      : {
          joint1: 'V2 joint 1 · base yaw',
          joint2: 'V2 joint 2 · shoulder',
          joint3: 'V2 joint 3 · elbow',
          joint4: 'V2 joint 4 · wrist pitch',
          joint5: 'V2 joint 5 · wrist yaw',
          gripper_joint: 'STS3215 gripper',
        };
    const poseDuration = 3.8;

    const ease = (value) => 0.5 - Math.cos(Math.PI * value) / 2;

    const animateJoints = (time) => {
      if (!robot || !motionEnabled) return;
      const seconds = time / 1000;
      const poseIndex = Math.floor(seconds / poseDuration) % poses.length;
      const nextIndex = (poseIndex + 1) % poses.length;
      const progress = ease((seconds % poseDuration) / poseDuration);

      jointNames.forEach((name) => {
        const joint = robot.joints[name];
        if (!joint) return;
        const start = poses[poseIndex][name];
        const end = poses[nextIndex][name];
        joint.setJointValue(THREE.MathUtils.lerp(start, end, progress));
      });

      if (jointLabel) {
        const displayName = displayJointNames[Math.floor(seconds * 1.15) % displayJointNames.length];
        jointLabel.textContent = jointLabels[displayName];
      }
    };

    const render = (time = 0) => {
      frameId = 0;
      if (!inViewport || document.hidden) return;
      if (time - lastFrame > 30) {
        animateJoints(time);
        controls.update();
        renderer.render(scene, camera);
        lastFrame = time;
      }
      frameId = requestAnimationFrame(render);
    };

    const requestRender = () => {
      if (!frameId && inViewport && !document.hidden) frameId = requestAnimationFrame(render);
    };

    const resize = () => {
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    };

    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) requestRender();
      else if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }, { rootMargin: '80px' }).observe(hero);

    document.addEventListener('visibilitychange', requestRender);
    controls.addEventListener('change', requestRender);

    toggle?.addEventListener('click', () => {
      motionEnabled = !motionEnabled;
      updateToggle();
      requestRender();
    });

    reduceMotion.addEventListener('change', (event) => {
      motionEnabled = !event.matches;
      updateToggle();
      requestRender();
    });

    const loadingManager = new THREE.LoadingManager();
    const loader = new URDFLoader(loadingManager);
    const meshCache = new Map();
    const loadMesh = loader.loadMeshCb;
    let modelLoadFailed = false;

    loader.loadMeshCb = (path, manager, done) => {
      const cached = meshCache.get(path);
      if (cached?.object) {
        done(cached.object.clone());
        return;
      }
      if (cached) {
        cached.callbacks.push(done);
        return;
      }

      const entry = { callbacks: [done], object: null };
      meshCache.set(path, entry);
      loadMesh(path, manager, (object, error) => {
        entry.object = object;
        entry.callbacks.splice(0).forEach((callback) => callback(object?.clone(), error));
      });
    };

    loadingManager.onError = (url) => {
      modelLoadFailed = true;
      console.error('[URDF hero] Asset load failed:', url);
    };

    loadingManager.onLoad = () => {
      if (!robot || modelLoadFailed) {
        setStatus(hero.dataset.fallbackLabel || 'Interactive model unavailable', 'fallback');
        return;
      }

      robot.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          material.roughness = 0.62;
          material.metalness = 0.04;
          if ('shininess' in material) material.shininess = 22;
        });
      });
      fitRobot();
      resize();
      hero.classList.add('urdf-ready');
      setStatus(hero.dataset.readyLabel || 'Interactive URDF ready', 'ready');
      updateToggle();
      requestRender();
    };

    loader.load(
      '/eco_lover_arm/arm_v2_yaw180.urdf',
      (loadedRobot) => {
        robot = loadedRobot;
        robot.rotation.x = -Math.PI / 2;
        scene.add(robot);
        jointNames.forEach((name) => robot.joints[name]?.setJointValue(poses[0][name]));
        requestRender();
      },
      undefined,
      (error) => {
        console.error('[URDF hero] Model load failed:', error);
        setStatus(hero.dataset.fallbackLabel || 'Interactive model unavailable', 'fallback');
      }
    );

    updateToggle();
    resize();
  }
}
