"use client";

import { useEffect, useRef } from "react";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uPointer;
  uniform vec3 uRipple;
  uniform vec3 uBase;
  uniform vec3 uDepth;
  uniform vec3 uGlow;
  uniform vec3 uAccent;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotation * p * 2.03 + 13.7;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(1.65, 1.0);
    p += uPointer * vec2(0.055, -0.04);
    float t = uTime * 0.14;

    p += vec2(sin(t + p.y * 2.0), cos(t * 0.8 + p.x * 2.4)) * 0.035;
    vec2 flow = vec2(
      fbm(p * 1.25 + vec2(t, -t * 0.55)),
      fbm(p * 1.18 + vec2(-t * 0.42, t * 0.72))
    );
    float field = fbm(p * 2.0 + (flow - 0.5) * 1.8 + t * 0.3);
    float folds = sin((p.x + flow.y * 0.7) * 8.0 - t * 3.0) * 0.5 + 0.5;
    folds *= sin((p.y - flow.x * 0.5) * 7.0 + t * 2.1) * 0.5 + 0.5;

    vec3 color = mix(uDepth, uBase, smoothstep(0.12, 0.88, field));
    color = mix(color, uGlow, smoothstep(0.48, 0.96, flow.x) * 0.46 * uIntensity);
    color = mix(color, uAccent, smoothstep(0.67, 0.98, field + folds * 0.18) * 0.34 * uIntensity);

    float halo = 1.0 - smoothstep(0.05, 0.72, length(p * vec2(0.78, 1.0)));
    color += uGlow * halo * 0.12 * uIntensity;
    float rippleAge = uTime - uRipple.z;
    float rippleDistance = distance(uv, uRipple.xy);
    float ripple = 1.0 - smoothstep(0.0, 0.018, abs(rippleDistance - rippleAge * 0.22));
    ripple *= 1.0 - smoothstep(0.0, 2.4, rippleAge);
    ripple *= step(0.0, rippleAge);
    color += uAccent * ripple * 0.62 * uIntensity;
    float vignette = smoothstep(1.05, 0.28, length(p));
    color *= 0.76 + vignette * 0.28;
    gl_FragColor = vec4(color, 0.96);
  }
`;

function cssColor(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

export function MotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
      } catch {
        canvas.hidden = true;
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setClearAlpha(0);
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const styles = getComputedStyle(document.documentElement);
      const uniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
        uPointer: { value: new THREE.Vector2() },
        uRipple: { value: new THREE.Vector3(0.5, 0.5, -10) },
        uBase: { value: new THREE.Color(cssColor(styles, "--bg", "#14231c")) },
        uDepth: { value: new THREE.Color(cssColor(styles, "--bg2", "#293a2e")).multiplyScalar(0.55) },
        uGlow: { value: new THREE.Color(cssColor(styles, "--glow", "#54725b")) },
        uAccent: { value: new THREE.Color(cssColor(styles, "--accent", "#b08d57")) },
      };
      const targets = {
        base: uniforms.uBase.value.clone(), depth: uniforms.uDepth.value.clone(), glow: uniforms.uGlow.value.clone(), accent: uniforms.uAccent.value.clone(), intensity: 1,
      };
      const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false, depthTest: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(plane);

      const particleCount = window.innerWidth < 700 ? 70 : 130;
      const positions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index++) {
        positions[index * 3] = THREE.MathUtils.randFloatSpread(12);
        positions[index * 3 + 1] = THREE.MathUtils.randFloatSpread(7);
        positions[index * 3 + 2] = THREE.MathUtils.randFloat(-1, 1);
      }
      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({ color: uniforms.uAccent.value, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false });
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      const clock = new THREE.Clock();
      const pointer = new THREE.Vector2();
      const smoothPointer = new THREE.Vector2();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      const syncTheme = () => {
        const computed = getComputedStyle(document.documentElement);
        targets.base.set(cssColor(computed, "--bg", "#14231c"));
        targets.depth.set(cssColor(computed, "--bg2", "#293a2e")).multiplyScalar(0.55);
        targets.glow.set(cssColor(computed, "--glow", "#54725b"));
        targets.accent.set(cssColor(computed, "--accent", "#b08d57"));
        targets.intensity = Number(computed.getPropertyValue("--atmosphere")) || 1;
      };
      const resize = () => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      const movePointer = (event: PointerEvent) => pointer.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
      const pulse = (event: PointerEvent) => uniforms.uRipple.value.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, uniforms.uTime.value);
      const render = () => {
        const computed = getComputedStyle(document.documentElement);
        const motion = Number(computed.getPropertyValue("--motion")) || 0;
        smoothPointer.lerp(pointer, 0.035);
        uniforms.uPointer.value.copy(smoothPointer);
        uniforms.uBase.value.lerp(targets.base, 0.025); uniforms.uDepth.value.lerp(targets.depth, 0.025);
        uniforms.uGlow.value.lerp(targets.glow, 0.025); uniforms.uAccent.value.lerp(targets.accent, 0.025);
        particlesMaterial.color.lerp(targets.accent, 0.035);
        uniforms.uIntensity.value += (targets.intensity - uniforms.uIntensity.value) * 0.04;
        uniforms.uTime.value = clock.getElapsedTime() * Math.max(0.08, motion);
        particles.rotation.z = uniforms.uTime.value * 0.012;
        particles.rotation.x = smoothPointer.y * 0.035;
        particles.rotation.y = smoothPointer.x * 0.035;
        renderer.render(scene, camera);
      };
      const syncLoop = () => {
        renderer.setAnimationLoop(null);
        if (reducedMotion.matches || document.hidden) render();
        else renderer.setAnimationLoop(render);
      };

      syncTheme(); resize(); syncLoop();
      const observer = new MutationObserver(syncTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", movePointer, { passive: true });
      window.addEventListener("pointerdown", pulse, { passive: true });
      document.addEventListener("visibilitychange", syncLoop);
      reducedMotion.addEventListener("change", syncLoop);

      cleanup = () => {
        renderer.setAnimationLoop(null); observer.disconnect();
        window.removeEventListener("resize", resize); window.removeEventListener("pointermove", movePointer); window.removeEventListener("pointerdown", pulse);
        document.removeEventListener("visibilitychange", syncLoop); reducedMotion.removeEventListener("change", syncLoop);
        particlesGeometry.dispose(); particlesMaterial.dispose(); plane.geometry.dispose(); material.dispose(); renderer.dispose();
      };
    });

    return () => { disposed = true; cleanup(); };
  }, []);

  return <canvas ref={canvasRef} className="motion-canvas" aria-hidden="true" />;
}
