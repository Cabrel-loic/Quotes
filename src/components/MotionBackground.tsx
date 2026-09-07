"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { BackgroundAnimation, GraphicsQuality } from "@/types/quote";

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
  uniform vec2 uResolution;
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

  vec3 circleWave(vec2 uv) {
    float aspect = uResolution.x / max(1.0, uResolution.y);
    vec2 point = (uv - 0.5) * 2.0;
    point.x *= aspect;
    float radius = length(point);
    float angle = atan(point.y, point.x);
    float phase = mod(uTime, 20.8) / 20.8;
    float cycle = phase * 6.28318530718;
    float baseRadius = 0.8 * min(1.0, aspect);
    float breathing = sin(cycle) * 0.018 + sin(cycle * 2.0) * 0.007;
    float turbulence = 0.5 - 0.5 * cos(cycle);
    vec3 color = vec3(0.0);

    for (int index = 0; index < 12; index++) {
      float band = float(index);
      float phaseOffset = band * 0.71;
      float direction = mod(band, 2.0) < 1.0 ? 1.0 : -1.0;
      float traveling = angle + direction * cycle * (1.0 + mod(band, 3.0)) + phaseOffset;
      float lowWave = sin(traveling * (2.0 + mod(band, 3.0))) * (0.016 + band * 0.0007);
      float mediumWave = sin(angle * (7.0 + mod(band, 5.0)) - cycle * (2.0 + mod(band, 4.0)) + phaseOffset) * (0.009 + turbulence * 0.009);
      float highWave = sin(angle * (18.0 + mod(band, 4.0) * 3.0) + cycle * (3.0 + mod(band, 5.0))) * (0.0035 + turbulence * 0.004);
      float localPulse = pow(max(0.0, sin(angle * 2.0 - cycle * (1.0 + mod(band, 3.0)) + phaseOffset)), 7.0);
      float targetRadius = baseRadius + breathing + (band - 5.5) * 0.0085 + lowWave + mediumWave + highWave + localPulse * 0.014;
      float distanceToBand = abs(radius - targetRadius);
      float strandWidth = 0.0018 + mod(band, 4.0) * 0.00065;
      float core = 1.0 - smoothstep(strandWidth, strandWidth + 0.0045, distanceToBand);
      float halo = exp(-distanceToBand * distanceToBand * (900.0 - band * 28.0));
      float broken = 0.28 + 0.72 * smoothstep(-0.42, 0.72, sin(angle * (3.0 + mod(band, 4.0)) + cycle * (1.0 + mod(band, 2.0)) + phaseOffset));
      vec3 bandColor = mix(vec3(0.19, 0.30, 0.78), vec3(0.48, 0.92, 1.0), band / 11.0);
      if (mod(band, 5.0) < 1.0) bandColor = mix(bandColor, vec3(0.57, 1.0, 0.76), 0.3);
      if (mod(band, 4.0) < 1.0) bandColor = mix(bandColor, vec3(0.72, 0.52, 1.0), 0.42);
      color += bandColor * (core * 0.48 + halo * 0.085) * broken * (0.55 + localPulse * 1.45);
      color += vec3(0.83, 0.91, 1.0) * core * localPulse * 0.62;
    }

    float innerMask = smoothstep(baseRadius * 0.62, baseRadius * 0.84, radius);
    float outerMask = 1.0 - smoothstep(baseRadius * 1.08, baseRadius * 1.34, radius);
    return color * innerMask * outerMask * uIntensity;
  }

  void main() {
    vec2 uv = vUv;
    if (uMode == 5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    if (uMode == 6) {
      vec3 wave = circleWave(uv);
      gl_FragColor = vec4(vec3(1.0) - exp(-wave * 1.18), 1.0);
      return;
    }
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
    if (uMode == 4) {
      float elevation = field * 13.0 + flow.x * 1.8;
      float contourDistance = abs(fract(elevation) - 0.5);
      float contour = 1.0 - smoothstep(0.025, 0.075, contourDistance);
      float majorDistance = abs(fract(elevation * 0.2) - 0.5);
      float major = 1.0 - smoothstep(0.018, 0.055, majorDistance);
      float pointerBend = exp(-distance(uv, uPointer * vec2(0.08, -0.06) + 0.5) * 5.0);
      color = mix(uDepth, uBase, smoothstep(0.05, 0.95, field));
      color = mix(color, uGlow, contour * (0.28 + pointerBend * 0.18) * uIntensity);
      color = mix(color, uAccent, major * 0.42 * uIntensity);
    } else if (uMode == 1) {
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

const morphVertexShader = /* glsl */ `
  precision highp float;
  attribute vec3 aSphere;
  attribute vec3 aTorus;
  attribute vec3 aHelix;
  attribute vec3 aScatter;
  attribute vec3 aColor;
  attribute float aDelay;
  attribute float aSize;
  uniform float uTime;
  uniform float uMotion;
  uniform float uScatterStrength;
  uniform float uPointScale;
  uniform float uCameraSpeed;
  uniform float uLoopDuration;
  uniform vec2 uPointer;
  varying vec3 vColor;
  varying float vGlow;

  float quintic(float value) {
    value = clamp(value, 0.0, 1.0);
    return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
  }

  vec3 transitionShape(vec3 from, vec3 to, float start, float duration, float clock, float scatterPulse) {
    float progress = clamp((clock - start) / duration, 0.0, 1.0);
    progress = clamp(progress + (aDelay - 0.5) * 0.16 * sin(progress * 3.14159265), 0.0, 1.0);
    float eased = quintic(progress);
    float scatter = sin(progress * 3.14159265) * scatterPulse;
    scatter *= smoothstep(0.0, 0.18, progress) * (1.0 - smoothstep(0.7, 1.0, progress));
    vec3 noisyDirection = normalize(aScatter + sin(aScatter.yzx * 5.0 + clock * 0.7) * 0.18);
    return mix(from, to, eased) + noisyDirection * scatter * uScatterStrength;
  }

  void main() {
    float clock = mod(uTime, uLoopDuration);
    vec3 positionNow = aSphere;
    if (clock >= 2.5 && clock < 4.5) positionNow = transitionShape(aSphere, aTorus, 2.5, 2.0, clock, 1.0);
    else if (clock >= 4.5 && clock < 6.0) positionNow = aTorus;
    else if (clock >= 6.0 && clock < 8.5) positionNow = transitionShape(aTorus, aHelix, 6.0, 2.5, clock, 1.0);
    else if (clock >= 8.5 && clock < 10.5) positionNow = aHelix;
    else if (clock >= 10.5 && clock < 13.0) positionNow = transitionShape(aHelix, aSphere, 10.5, 2.5, clock, 1.0);
    else if (clock >= 15.0) positionNow = transitionShape(aSphere, aSphere, 15.0, 3.7, clock, 0.72);

    float orbit = uTime * uCameraSpeed;
    float cosine = cos(orbit);
    float sine = sin(orbit);
    positionNow.xz = mat2(cosine, -sine, sine, cosine) * positionNow.xz;
    positionNow.x += uPointer.x * 0.06 * uMotion;
    positionNow.y += uPointer.y * 0.04 * uMotion;
    vec4 viewPosition = modelViewMatrix * vec4(positionNow, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * uPointScale * (7.0 / max(1.0, -viewPosition.z));
    vColor = aColor;
    vGlow = 0.75 + aSize * 0.08;
  }
`;

const morphFragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vGlow;
  uniform float uIntensity;
  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float distanceFromCenter = length(centered);
    if (distanceFromCenter > 0.5) discard;
    float core = 1.0 - smoothstep(0.02, 0.18, distanceFromCenter);
    float halo = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
    float alpha = (core * 0.72 + halo * 0.3) * vGlow * min(uIntensity, 1.2);
    gl_FragColor = vec4(vColor * (0.72 + core * 0.62), alpha);
  }
`;

export const particleMorphConfig = {
  count: 2400,
  sphereRadius: 2,
  torusMajorRadius: 1.25,
  torusTubeRadius: 0.35,
  helixRadius: 0.9,
  helixHeight: 2.8,
  helixTurns: 6,
  loopDuration: 18.7,
  scatterStrength: 0.72,
  cameraSpeed: 0.055,
  colors: ["#ffffff", "#b8ddff", "#8aa8ff", "#a98cff", "#6ce9ff", "#8fffc1", "#ff9cda"],
} as const;

function cssColor(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

const modeIndex: Record<BackgroundAnimation, number> = { harbor: 0, aurora: 1, constellation: 2, embers: 3, topography: 4, particleMorph: 5, circleWave: 6 };

type MotionBackgroundProps = { animation: BackgroundAnimation; interaction: boolean; quality: GraphicsQuality };

export const MotionBackground = forwardRef<MotionBackgroundHandle, MotionBackgroundProps>(function MotionBackground({ animation, interaction, quality }, ref) {
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

      const touchDevice = window.matchMedia("(pointer: coarse)").matches;
      const weakDevice = touchDevice || (navigator.hardwareConcurrency || 4) <= 4;
      const qualityScale = quality === "battery" ? 0.8 : quality === "balanced" ? 1.1 : weakDevice ? 0.9 : 1.35;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualityScale));
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
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMode: { value: modeIndex[animation] },
      };
      const targets = {
        base: uniforms.uBase.value.clone(), depth: uniforms.uDepth.value.clone(), glow: uniforms.uGlow.value.clone(), accent: uniforms.uAccent.value.clone(), intensity: 1,
      };
      const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false, depthTest: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(plane);

      const morphScene = new THREE.Scene();
      const morphCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
      morphCamera.position.z = 7;
      const morphCount = quality === "battery" ? 1800 : weakDevice ? 2100 : particleMorphConfig.count;
      const spherePositions = new Float32Array(morphCount * 3);
      const torusPositions = new Float32Array(morphCount * 3);
      const helixPositions = new Float32Array(morphCount * 3);
      const scatterDirections = new Float32Array(morphCount * 3);
      const morphColors = new Float32Array(morphCount * 3);
      const morphDelays = new Float32Array(morphCount);
      const morphSizes = new Float32Array(morphCount);
      const colorChoices = particleMorphConfig.colors;
      let randomState = 0x51f15e;
      const seededRandom = () => {
        randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
        return randomState / 4294967296;
      };
      for (let index = 0; index < morphCount; index++) {
        const offset = index * 3;
        const fraction = (index + 0.5) / morphCount;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const sphereY = 1 - 2 * fraction;
        const sphereRadiusAtY = Math.sqrt(Math.max(0, 1 - sphereY * sphereY));
        const sphereAngle = goldenAngle * index;
        spherePositions[offset] = Math.cos(sphereAngle) * sphereRadiusAtY * particleMorphConfig.sphereRadius;
        spherePositions[offset + 1] = sphereY * particleMorphConfig.sphereRadius;
        spherePositions[offset + 2] = Math.sin(sphereAngle) * sphereRadiusAtY * particleMorphConfig.sphereRadius;

        const torusU = fraction * Math.PI * 2;
        const torusV = (index * goldenAngle) % (Math.PI * 2);
        const torusRadius = particleMorphConfig.torusMajorRadius + particleMorphConfig.torusTubeRadius * Math.cos(torusV);
        torusPositions[offset] = torusRadius * Math.cos(torusU);
        torusPositions[offset + 1] = torusRadius * Math.sin(torusU);
        torusPositions[offset + 2] = particleMorphConfig.torusTubeRadius * Math.sin(torusV);

        const helixAngle = fraction * Math.PI * 2 * particleMorphConfig.helixTurns;
        const helixThickness = (seededRandom() - 0.5) * 0.22;
        helixPositions[offset] = (particleMorphConfig.helixRadius + helixThickness) * Math.cos(helixAngle);
        helixPositions[offset + 1] = (fraction - 0.5) * particleMorphConfig.helixHeight;
        helixPositions[offset + 2] = (particleMorphConfig.helixRadius + helixThickness) * Math.sin(helixAngle);

        const scatterTheta = seededRandom() * Math.PI * 2;
        const scatterZ = seededRandom() * 2 - 1;
        const scatterRadius = Math.sqrt(1 - scatterZ * scatterZ);
        scatterDirections[offset] = Math.cos(scatterTheta) * scatterRadius;
        scatterDirections[offset + 1] = scatterZ;
        scatterDirections[offset + 2] = Math.sin(scatterTheta) * scatterRadius;
        const color = new THREE.Color(colorChoices[Math.min(colorChoices.length - 1, Math.floor(seededRandom() ** 1.55 * colorChoices.length))]);
        morphColors[offset] = color.r; morphColors[offset + 1] = color.g; morphColors[offset + 2] = color.b;
        morphDelays[index] = seededRandom();
        morphSizes[index] = 0.72 + seededRandom() * 0.68;
      }
      const morphGeometry = new THREE.BufferGeometry();
      morphGeometry.setAttribute("position", new THREE.BufferAttribute(spherePositions, 3));
      morphGeometry.setAttribute("aSphere", new THREE.BufferAttribute(spherePositions, 3));
      morphGeometry.setAttribute("aTorus", new THREE.BufferAttribute(torusPositions, 3));
      morphGeometry.setAttribute("aHelix", new THREE.BufferAttribute(helixPositions, 3));
      morphGeometry.setAttribute("aScatter", new THREE.BufferAttribute(scatterDirections, 3));
      morphGeometry.setAttribute("aColor", new THREE.BufferAttribute(morphColors, 3));
      morphGeometry.setAttribute("aDelay", new THREE.BufferAttribute(morphDelays, 1));
      morphGeometry.setAttribute("aSize", new THREE.BufferAttribute(morphSizes, 1));
      const morphUniforms = {
        uTime: { value: 0 }, uMotion: { value: 0.5 }, uIntensity: { value: 1 },
        uScatterStrength: { value: particleMorphConfig.scatterStrength },
        uPointScale: { value: quality === "battery" ? 7.5 : 9.5 },
        uCameraSpeed: { value: particleMorphConfig.cameraSpeed },
        uLoopDuration: { value: particleMorphConfig.loopDuration },
        uPointer: { value: new THREE.Vector2() },
      };
      const morphMaterial = new THREE.ShaderMaterial({
        vertexShader: morphVertexShader, fragmentShader: morphFragmentShader, uniforms: morphUniforms,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
      });
      const morphParticles = new THREE.Points(morphGeometry, morphMaterial);
      morphParticles.visible = animation === "particleMorph";
      morphScene.add(morphParticles);

      const baseParticles = quality === "battery" ? 28 : weakDevice ? 48 : 90;
      const particleCount = animation === "topography" ? Math.round(baseParticles * 0.22) : baseParticles;
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
      particles.visible = animation !== "particleMorph" && animation !== "circleWave";
      scene.add(particles);

      const timer = new THREE.Timer();
      timer.connect(document);
      const pointer = new THREE.Vector2();
      const smoothPointer = new THREE.Vector2();
      const trail = uniforms.uTrail.value;
      let lastTrailTime = 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let motionAmount = 0.5;

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
        motionAmount = Number(computed.getPropertyValue("--motion")) || 0;
      };
      const resize = () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        uniforms.uResolution.value.set(canvas.clientWidth, canvas.clientHeight);
        morphCamera.aspect = Math.max(0.35, canvas.clientWidth / Math.max(1, canvas.clientHeight));
        morphCamera.updateProjectionMatrix();
      };
      const movePointer = (event: PointerEvent) => {
        if (!interaction || motionAmount === 0 || touchDevice) return;
        pointer.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
        const now = performance.now();
        if (now - lastTrailTime > 18) {
          for (let index = trail.length - 1; index > 0; index--) trail[index].copy(trail[index - 1]);
          trail[0].set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, 0);
          lastTrailTime = now;
        }
      };
      const pulse = (event: PointerEvent) => {
        if (!interaction || motionAmount === 0) return;
        uniforms.uRipple.value.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, uniforms.uTime.value);
      };
      const render = (timestamp?: number) => {
        timer.update(timestamp);
        smoothPointer.lerp(pointer, 0.035);
        uniforms.uPointer.value.copy(smoothPointer);
        uniforms.uBase.value.lerp(targets.base, 0.025); uniforms.uDepth.value.lerp(targets.depth, 0.025);
        uniforms.uGlow.value.lerp(targets.glow, 0.025); uniforms.uAccent.value.lerp(targets.accent, 0.025);
        particlesMaterial.color.lerp(targets.accent, 0.035);
        uniforms.uIntensity.value += (targets.intensity - uniforms.uIntensity.value) * 0.04;
        const timelineScale = animation === "particleMorph" || animation === "circleWave" ? motionAmount * 2 : motionAmount;
        uniforms.uTime.value = timer.getElapsed() * timelineScale;
        morphUniforms.uTime.value = timer.getElapsed() * timelineScale;
        morphUniforms.uMotion.value = motionAmount;
        morphUniforms.uIntensity.value = uniforms.uIntensity.value;
        morphUniforms.uPointer.value.copy(smoothPointer);
        const frameDelta = timer.getDelta();
        for (const point of trail) point.z = Math.min(1, point.z + frameDelta * 0.72);
        particles.rotation.z = uniforms.uTime.value * 0.012;
        particles.rotation.x = smoothPointer.y * 0.035;
        particles.rotation.y = smoothPointer.x * 0.035;
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(scene, camera);
        if (morphParticles.visible) { renderer.clearDepth(); renderer.render(morphScene, morphCamera); }
      };
      captureRef.current = () => {
        renderer.autoClear = false;
        renderer.clear(); renderer.render(scene, camera);
        if (morphParticles.visible) { renderer.clearDepth(); renderer.render(morphScene, morphCamera); }
        try { return canvas.toDataURL("image/png"); } catch { return null; }
      };
      const syncLoop = () => {
        renderer.setAnimationLoop(null);
        if (reducedMotion.matches || document.hidden || motionAmount === 0) render();
        else renderer.setAnimationLoop(render);
      };

      syncTheme(); resize(); syncLoop();
      const observer = new MutationObserver(() => { syncTheme(); syncLoop(); });
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
        timer.dispose(); particlesGeometry.dispose(); particlesMaterial.dispose(); morphGeometry.dispose(); morphMaterial.dispose(); plane.geometry.dispose(); material.dispose(); renderer.dispose();
      };
    });

    return () => { disposed = true; cleanup(); };
  }, [animation, interaction, quality]);

  return <canvas ref={canvasRef} className="motion-canvas" aria-hidden="true" />;
});
