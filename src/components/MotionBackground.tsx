"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { BackgroundAnimation } from "@/types/quote";

export interface MotionBackgroundHandle { capture: () => string | null }

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
  uniform float uGrain;
  uniform vec2 uPointer;
  uniform vec3 uRipple;
  uniform vec3 uBase;
  uniform vec3 uDepth;
  uniform vec3 uGlow;
  uniform vec3 uAccent;
  uniform vec3 uTrailColor;
  uniform vec3 uTrail[18];
  uniform int uMode;

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

  float trailGlow(vec2 uv) {
    float glow = 0.0;
    for (int i = 0; i < 18; i++) {
      vec3 point = uTrail[i];
      float life = max(0.0, 1.0 - point.z);
      float distanceToTrail = distance(uv, point.xy);
      glow += exp(-distanceToTrail * distanceToTrail * 1900.0) * life * life;
    }
    return min(glow, 1.7);
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

    vec3 color = mix(uDepth, uBase, smoothstep(0.08, 0.9, field));
    if (uMode == 1) {
      float veil = pow(abs(sin((p.x + flow.y * 0.72) * 5.2 + t * 2.8)), 7.0);
      color = mix(color, uGlow, veil * 0.78 * uIntensity);
      color += uAccent * pow(max(0.0, 0.7 - abs(p.y + flow.x - 0.8)), 3.0) * 1.6;
    } else if (uMode == 2) {
      vec2 cells = fract((p + flow * 0.28) * 7.0) - 0.5;
      float stars = pow(max(0.0, 1.0 - length(cells) * 10.0), 8.0);
      float orbit = 1.0 - smoothstep(0.0, 0.018, abs(length(p + (flow - 0.5) * 0.2) - 0.42 - sin(t) * 0.04));
      color += (uGlow * stars * 1.7 + uAccent * orbit * 0.48) * uIntensity;
    } else if (uMode == 3) {
      float sparks = pow(max(0.0, noise(vec2(floor(p.x * 19.0), floor((p.y - t * 1.8) * 17.0))) - 0.78), 3.0) * 75.0;
      color = mix(color, uAccent, smoothstep(0.54, 0.96, field + folds * 0.32) * 0.65 * uIntensity);
      color += mix(uAccent, vec3(1.0), 0.4) * sparks * uIntensity;
    } else {
      float tide = sin((p.y + flow.x * 0.85) * 10.0 + t * 2.3) * 0.5 + 0.5;
      color = mix(color, uGlow, smoothstep(0.42, 0.92, flow.x) * 0.68 * uIntensity);
      color = mix(color, uAccent, smoothstep(0.72, 0.99, field + tide * 0.2) * 0.48 * uIntensity);
    }

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
    float wake = trailGlow(uv);
    color = mix(color, uTrailColor, min(0.92, wake * 0.82));
    color += uTrailColor * wake * 0.34;
    float grain = hash(gl_FragCoord.xy + vec2(uTime * 41.7, -uTime * 29.3)) - 0.5;
    color += grain * 0.075 * uGrain;
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, 1.16);
    color = (color - 0.5) * 1.08 + 0.5;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function cssColor(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

const modeIndex: Record<BackgroundAnimation, number> = { harbor: 0, aurora: 1, constellation: 2, embers: 3 };

export const MotionBackground = forwardRef<MotionBackgroundHandle, { animation: BackgroundAnimation }>(function MotionBackground({ animation }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<() => string | null>(() => null);
  useImperativeHandle(ref, () => ({ capture: () => captureRef.current() }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
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
        uGrain: { value: 1 },
        uPointer: { value: new THREE.Vector2() },
        uRipple: { value: new THREE.Vector3(0.5, 0.5, -10) },
        uBase: { value: new THREE.Color(cssColor(styles, "--bg", "#14231c")) },
        uDepth: { value: new THREE.Color(cssColor(styles, "--bg2", "#293a2e")).multiplyScalar(0.55) },
        uGlow: { value: new THREE.Color(cssColor(styles, "--glow", "#54725b")) },
        uAccent: { value: new THREE.Color(cssColor(styles, "--accent", "#b08d57")) },
        uTrailColor: { value: new THREE.Color("#ffffff") },
        uTrail: { value: Array.from({ length: 18 }, () => new THREE.Vector3(-1, -1, 1)) },
        uMode: { value: modeIndex[animation] },
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

      const timer = new THREE.Timer();
      timer.connect(document);
      const pointer = new THREE.Vector2();
      const smoothPointer = new THREE.Vector2();
      const trail = uniforms.uTrail.value;
      let lastTrailTime = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      const syncTheme = () => {
        const computed = getComputedStyle(document.documentElement);
        targets.base.set(cssColor(computed, "--bg", "#14231c"));
        targets.depth.set(cssColor(computed, "--bg2", "#293a2e")).multiplyScalar(0.55);
        targets.glow.set(cssColor(computed, "--glow", "#54725b"));
        targets.accent.set(cssColor(computed, "--accent", "#b08d57"));
        const background = new THREE.Color(cssColor(computed, "--bg", "#14231c"));
        const luminance = background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722;
        uniforms.uTrailColor.value.set(luminance > 0.52 ? "#102e3a" : "#f8f2d2").lerp(targets.accent, 0.28);
        targets.intensity = Number(computed.getPropertyValue("--atmosphere")) || 1;
        uniforms.uGrain.value = Number(computed.getPropertyValue("--grain")) || 0;
      };
      const resize = () => renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      const movePointer = (event: PointerEvent) => {
        pointer.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
        const now = performance.now();
        if (now - lastTrailTime > 18) {
          for (let index = trail.length - 1; index > 0; index--) trail[index].copy(trail[index - 1]);
          trail[0].set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, 0);
          lastTrailTime = now;
        }
      };
      const pulse = (event: PointerEvent) => uniforms.uRipple.value.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, uniforms.uTime.value);
      const render = (timestamp?: number) => {
        timer.update(timestamp);
        const computed = getComputedStyle(document.documentElement);
        const motion = Number(computed.getPropertyValue("--motion")) || 0;
        smoothPointer.lerp(pointer, 0.035);
        uniforms.uPointer.value.copy(smoothPointer);
        uniforms.uBase.value.lerp(targets.base, 0.025); uniforms.uDepth.value.lerp(targets.depth, 0.025);
        uniforms.uGlow.value.lerp(targets.glow, 0.025); uniforms.uAccent.value.lerp(targets.accent, 0.025);
        particlesMaterial.color.lerp(targets.accent, 0.035);
        uniforms.uIntensity.value += (targets.intensity - uniforms.uIntensity.value) * 0.04;
        uniforms.uTime.value = timer.getElapsed() * Math.max(0.08, motion);
        for (const point of trail) point.z = Math.min(1, point.z + timer.getDelta() * 0.72);
        particles.rotation.z = uniforms.uTime.value * 0.012;
        particles.rotation.x = smoothPointer.y * 0.035;
        particles.rotation.y = smoothPointer.x * 0.035;
        renderer.render(scene, camera);
      };
      captureRef.current = () => {
        renderer.render(scene, camera);
        try { return canvas.toDataURL("image/png"); } catch { return null; }
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
        captureRef.current = () => null;
        timer.dispose(); particlesGeometry.dispose(); particlesMaterial.dispose(); plane.geometry.dispose(); material.dispose(); renderer.dispose();
      };
    });

    return () => { disposed = true; cleanup(); };
  }, [animation]);

  return <canvas ref={canvasRef} className="motion-canvas" aria-hidden="true" />;
});
