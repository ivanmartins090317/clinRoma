import { describe, expect, it } from "vitest";

import { FDI_TOOTH_NUMBERS } from "@/features/records/domain/tooth-fdi";
import {
  CROSS_LOWER_LEFT,
  CROSS_LOWER_RIGHT,
  CROSS_LOWER_ROW,
  CROSS_UPPER_LEFT,
  CROSS_UPPER_RIGHT,
  CROSS_UPPER_ROW,
  getArchPosition,
  getBitingSurface,
  getOcclusalFaceLayout,
  getPatientSide,
  getRootCount,
  getRootDirection,
  getScreenSide,
  getTongueSideSurface,
  getViewStack,
  isAnteriorTooth,
  isCrossToothNumber,
  ODONTOGRAM_TOUCH_FACE_MIN_PX,
  resolveSurfaceColor,
  TOOTH_SURFACE_LABELS,
} from "@/features/records/domain/odontogram-cross";

describe("odontogram-cross", () => {
  it("dispõe os quadrantes na cruz: 18-11, 21-28, 48-41, 31-38", () => {
    expect([...CROSS_UPPER_RIGHT]).toEqual([18, 17, 16, 15, 14, 13, 12, 11]);
    expect([...CROSS_UPPER_LEFT]).toEqual([21, 22, 23, 24, 25, 26, 27, 28]);
    expect([...CROSS_LOWER_RIGHT]).toEqual([48, 47, 46, 45, 44, 43, 42, 41]);
    expect([...CROSS_LOWER_LEFT]).toEqual([31, 32, 33, 34, 35, 36, 37, 38]);
  });

  it("cola 11 e 21 na linha vertical; 18 e 28 nos extremos", () => {
    expect(CROSS_UPPER_RIGHT.at(-1)).toBe(11);
    expect(CROSS_UPPER_LEFT[0]).toBe(21);
    expect(CROSS_UPPER_RIGHT[0]).toBe(18);
    expect(CROSS_UPPER_LEFT.at(-1)).toBe(28);
    expect(CROSS_LOWER_RIGHT.at(-1)).toBe(41);
    expect(CROSS_LOWER_LEFT[0]).toBe(31);
    expect(CROSS_LOWER_RIGHT[0]).toBe(48);
    expect(CROSS_LOWER_LEFT.at(-1)).toBe(38);
  });

  it("coloca a direita do paciente à esquerda da tela", () => {
    expect(getPatientSide(18)).toBe("right");
    expect(getScreenSide(18)).toBe("left");
    expect(getPatientSide(11)).toBe("right");
    expect(getScreenSide(11)).toBe("left");
    expect(getPatientSide(21)).toBe("left");
    expect(getScreenSide(21)).toBe("right");
    expect(getPatientSide(28)).toBe("left");
    expect(getScreenSide(28)).toBe("right");
    expect(getPatientSide(48)).toBe("right");
    expect(getScreenSide(48)).toBe("left");
    expect(getPatientSide(31)).toBe("left");
    expect(getScreenSide(31)).toBe("right");
  });

  it("separa arco superior e inferior", () => {
    expect(getArchPosition(16)).toBe("upper");
    expect(getArchPosition(24)).toBe("upper");
    expect(getArchPosition(36)).toBe("lower");
    expect(getArchPosition(41)).toBe("lower");
  });

  it("usa palatina no arco superior e lingual no inferior", () => {
    expect(getTongueSideSurface(11)).toBe("palatina");
    expect(getTongueSideSurface(28)).toBe("palatina");
    expect(getTongueSideSurface(31)).toBe("lingual");
    expect(getTongueSideSurface(48)).toBe("lingual");
  });

  it("usa incisal nos anteriores e oclusal nos posteriores", () => {
    expect(isAnteriorTooth(11)).toBe(true);
    expect(isAnteriorTooth(23)).toBe(true);
    expect(isAnteriorTooth(41)).toBe(true);
    expect(isAnteriorTooth(14)).toBe(false);
    expect(isAnteriorTooth(36)).toBe(false);
    expect(getBitingSurface(11)).toBe("incisal");
    expect(getBitingSurface(23)).toBe("incisal");
    expect(getBitingSurface(24)).toBe("oclusal");
    expect(getBitingSurface(36)).toBe("oclusal");
    expect(getBitingSurface(48)).toBe("oclusal");
  });

  it("orienta as faces da vista oclusal em relação à cruz", () => {
    expect(getOcclusalFaceLayout(24)).toEqual({
      center: "oclusal",
      top: "vestibular",
      bottom: "palatina",
      left: "mesial",
      right: "distal",
    });

    expect(getOcclusalFaceLayout(16)).toEqual({
      center: "oclusal",
      top: "vestibular",
      bottom: "palatina",
      left: "distal",
      right: "mesial",
    });

    expect(getOcclusalFaceLayout(11)).toEqual({
      center: "incisal",
      top: "vestibular",
      bottom: "palatina",
      left: "distal",
      right: "mesial",
    });

    expect(getOcclusalFaceLayout(36)).toEqual({
      center: "oclusal",
      top: "lingual",
      bottom: "vestibular",
      left: "mesial",
      right: "distal",
    });

    expect(getOcclusalFaceLayout(41)).toEqual({
      center: "incisal",
      top: "lingual",
      bottom: "vestibular",
      left: "distal",
      right: "mesial",
    });
  });

  it("aponta raízes para fora da cruz e empilha as três vistas", () => {
    expect(getRootDirection(18)).toBe("up");
    expect(getRootDirection(31)).toBe("down");
    expect(getViewStack(11)).toEqual(["root", "crown", "occlusal"]);
    expect(getViewStack(36)).toEqual(["occlusal", "crown", "root"]);
  });

  it("cobre os 32 dentes permanentes exatamente uma vez", () => {
    const laidOut = [...CROSS_UPPER_ROW, ...CROSS_LOWER_ROW];
    expect(laidOut).toHaveLength(32);
    expect(new Set(laidOut).size).toBe(32);
    expect([...laidOut].sort((a, b) => a - b)).toEqual([...FDI_TOOTH_NUMBERS]);
    expect(laidOut.every(isCrossToothNumber)).toBe(true);
  });

  it("distingue raízes de molares e pré-molares para a silhueta", () => {
    expect(getRootCount(11)).toBe(1);
    expect(getRootCount(14)).toBe(2);
    expect(getRootCount(24)).toBe(2);
    expect(getRootCount(15)).toBe(1);
    expect(getRootCount(34)).toBe(1);
    expect(getRootCount(16)).toBe(3);
    expect(getRootCount(26)).toBe(3);
    expect(getRootCount(36)).toBe(2);
    expect(getRootCount(46)).toBe(2);
  });

  it("devolve cor neutra sem achado e a cor da paleta com condição", () => {
    expect(resolveSurfaceColor(undefined)).toBe("#e5e7eb");
    expect(resolveSurfaceColor("caries")).toBe("#ef4444");
    expect(resolveSurfaceColor("restoration")).toBe("#3b82f6");
  });

  it("define alvo de toque de 44 px no zoom de trabalho", () => {
    expect(ODONTOGRAM_TOUCH_FACE_MIN_PX).toBe(44);
  });

  it("rótula as faces em pt-BR", () => {
    expect(TOOTH_SURFACE_LABELS.oclusal).toBe("Oclusal");
    expect(TOOTH_SURFACE_LABELS.palatina).toBe("Palatina");
    expect(TOOTH_SURFACE_LABELS.incisal).toBe("Incisal");
  });
});
