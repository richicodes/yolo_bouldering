import Konva from 'konva';
import { Ref, ref } from 'vue';

import { BoxState, SelectMode } from '@/components/wall-image-viewer/enums';
import {
  ActiveBoundingBoxFootHold,
  ActiveBoundingBoxHandHold,
  BoundingBoxNumbering,
  DefaultBoundingBox,
  OPTIMIZATION_PARAMS,
} from '@/components/wall-image-viewer/boundingBoxAttributes';
import { BoxDimensions } from '@/components/wall-image-viewer/types';

export function useBoundingBox(
  boxLayer: Konva.Layer,
  selectedMode: Ref<SelectMode>,
): UseBoundingBox {
  const boxState = ref<BoxState>(BoxState.DUAL_START_HANDHOLD);
  const numberText = ref<number>(4);
  const konvaRect: Konva.Rect = new Konva.Rect();
  const konvaGroup: Konva.Group = new Konva.Group();
  const konvaText: Konva.Text = new Konva.Text();
  const konvaTape1: Konva.Line = new Konva.Line();
  const konvaTape2: Konva.Line = new Konva.Line();

  const updateRectBoxState = () => {
    let boundingBoxAttributes = null;
    switch (+boxState.value) {
      case BoxState.HIDDEN:
        boundingBoxAttributes = { opacity: 0, strokeWidth: 0 };
        break;
      case BoxState.UNSELECTED:
        boundingBoxAttributes = DefaultBoundingBox;
        break;
      case BoxState.NORMAL_HANDHOLD:
      case BoxState.SINGLE_START_HANDHOLD:
      case BoxState.DUAL_START_HANDHOLD:
      case BoxState.END_HANDHOLD:
        boundingBoxAttributes = ActiveBoundingBoxHandHold;
        break;
      case BoxState.FOOTHOLD:
        boundingBoxAttributes = ActiveBoundingBoxFootHold;
        break;
      default:
        boundingBoxAttributes = DefaultBoundingBox;
    }
    konvaRect.setAttrs({
      ...boundingBoxAttributes,
      ...OPTIMIZATION_PARAMS,
    });
  };

  const updateText = () => {
    if (numberText.value !== 0) {
      konvaText.setAttrs({
        x: 0,
        y: konvaGroup.height() + 2,
        text: numberText.value.toString(),
        fillAfterStrokeEnabled: true,
        opacity: 1,
        ...BoundingBoxNumbering,
        ...OPTIMIZATION_PARAMS,
      });
    } else {
      konvaText.setAttrs({ opacity: 0, ...OPTIMIZATION_PARAMS });
    }
  };

  const updateTapes = () => {
    const corner = Math.min(konvaRect.width() / 5, -10);
    switch (+boxState.value) {
      case BoxState.DUAL_START_HANDHOLD:
      case BoxState.END_HANDHOLD:
        konvaTape2.setAttrs({
          points: [10, 0, corner + 10, corner],
          stroke: 'red',
          strokeWidth: konvaRect.strokeWidth() * 1.5,
          opacity: 1,
          ...OPTIMIZATION_PARAMS,
        });
      // eslint-disable-next-line no-fallthrough
      case BoxState.SINGLE_START_HANDHOLD:
        konvaTape1.setAttrs({
          points: [0, 0, corner, corner],
          stroke: 'red',
          strokeWidth: konvaRect.strokeWidth() * 1.5,
          opacity: 1,
          ...OPTIMIZATION_PARAMS,
        });
        break;
      default:
        konvaTape1.setAttrs({
          opacity: 0,
          ...OPTIMIZATION_PARAMS,
        });
        konvaTape2.setAttrs({
          opacity: 0,
          ...OPTIMIZATION_PARAMS,
        });
    }
  };

  // const updateBoxState = (newBoxState: BoxState) => {
  //   boxState.value = newBoxState;
  // }

  const resizeBoundingBox = (factor: number) => {
    konvaGroup.x(konvaGroup.x() * factor);
    konvaGroup.y(konvaGroup.y() * factor);
    konvaGroup.width(konvaGroup.width() * factor);
    konvaGroup.height(konvaGroup.height() * factor);
    konvaRect.width(konvaRect.width() * factor);
    konvaRect.height(konvaRect.height() * factor);
    updateText();
  };

  const registerBoundingBox = (boxDimensions: BoxDimensions) => {
    const { x, y, width, height } = boxDimensions;
    konvaGroup.setAttrs({ x, y, width, height });
    konvaRect.width(width);
    konvaRect.height(height);

    konvaRect.on('mouseover', () => {
      if (+selectedMode.value !== SelectMode.DRAWBOX) {
        konvaRect.strokeWidth(5);
      }
      boxLayer.batchDraw();
    });
    konvaRect.on('mouseout', () => {
      if (+selectedMode.value !== SelectMode.DRAWBOX) {
        updateRectBoxState();
      }
      boxLayer.batchDraw();
    });
    konvaRect.on('click', () => {
      onClickRect();
    });
    konvaRect.on('tap', () => {
      onClickRect();
    });
    konvaGroup.add(konvaRect);
    konvaGroup.add(konvaText);
    konvaGroup.add(konvaTape1);
    konvaGroup.add(konvaTape2);
    boxLayer.add(konvaGroup);
    updateBoundingBox();
  };

  const updateBoundingBox = () => {
    updateRectBoxState();
    updateText();
    updateTapes();
  };

  const onClickRect = () => {
    switch (+selectedMode.value) {
      case SelectMode.FOOTHOLD:
        switch (+boxState.value) {
          case BoxState.UNSELECTED:
            boxState.value = BoxState.FOOTHOLD;
            break;
          case BoxState.NORMAL_HANDHOLD:
          case BoxState.SINGLE_START_HANDHOLD:
          case BoxState.DUAL_START_HANDHOLD:
          case BoxState.END_HANDHOLD:
          case BoxState.FOOTHOLD:
            boxState.value = BoxState.UNSELECTED;
            break;
        }
        break;
      case SelectMode.HANDHOLD:
        switch (+boxState.value) {
          case BoxState.UNSELECTED:
            boxState.value = BoxState.NORMAL_HANDHOLD;
            break;
          case BoxState.NORMAL_HANDHOLD:
          case BoxState.SINGLE_START_HANDHOLD:
          case BoxState.DUAL_START_HANDHOLD:
          case BoxState.END_HANDHOLD:
          case BoxState.FOOTHOLD:
            boxState.value = BoxState.UNSELECTED;
            break;
        }
        break;
    }
    updateBoundingBox();
    boxLayer.batchDraw();
  };

  return {
    registerBoundingBox,
    resizeBoundingBox,
  };
}

interface UseBoundingBox {
  registerBoundingBox: (b: BoxDimensions) => void;
  resizeBoundingBox: (f: number) => void;
}