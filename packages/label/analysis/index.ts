/**
 * @file Label - 标注分析
 * @module Label/analysis
 */

import { MinaComponent } from '../../common/component';
import {
  selectorQuery,
  drawLayout,
  computeLayout,
  getRealPath,
} from '../shared/tool';

let __forceUpdate__ = false;

const callbacks = [] as any[];
const mountedCallbacks = [] as any[];

const isPlainArray = (data) => Array.isArray(data) && data.length;
const isPlainFunction = (data) => typeof data === 'function';

const flushCallbacks = (type) => {
  const copies = callbacks.slice(0);
  const mounteCopies = mountedCallbacks.slice(0);

  switch (type) {
    case 'rendered':
      callbacks.length = 0;
      for (let i = 0; i < copies.length; i++) {
        if (isPlainFunction(copies[i])) {
          copies[i]();
        }
      }
      break;
    case 'mounted':
      mountedCallbacks.length = 0;
      for (let i = 0; i < mounteCopies.length; i++) {
        if (isPlainFunction(mounteCopies[i])) {
          mounteCopies[i]();
        }
      }
      break;
    default:
      break;
  }
};

const execute = () => Promise.resolve().then(() => flushCallbacks('rendered'));
const moutedExecute = () =>
  Promise.resolve().then(() => flushCallbacks('mounted'));

MinaComponent({
  props: {
    /**
     * @property {String} mt - margin top
     * @property {String} mb - margin bottom
     * @property {String} width - 宽度
     * @property {String} height - 高度
     * @property {String} bgColor - 背景颜色
     * @property {Number} scaleMin - 最小缩放倍数
     * @property {Number} scaleMax - 最大缩放倍数
     */
    mt: {
      type: String,
      value: '20rpx',
    },
    mb: {
      type: String,
      value: '20rpx',
    },
    width: {
      type: String,
      value: '750rpx',
    },
    height: {
      type: String,
      value: '100vh',
    },
    bgColor: {
      type: String,
      value: '#fff',
    },
    scaleMin: {
      type: Number,
      default: 0.5,
    },
    scaleMax: {
      type: Number,
      default: 1.5,
    },

    /**
     * @property {Object} colors - 样式配置
     * @property {Array} image - 图片信息
     * @property {Array} labels -标记信息
     */
    colors: {
      type: Object,
      value: {},
    },
    image: {
      type: Object,
      value: {},
    },
    labels: {
      type: Array,
      default: {},
      observer(newVal, oldVal) {
        if (isPlainArray(newVal)) {
          if (__forceUpdate__ || !isPlainArray(oldVal)) {
            this.init();
            __forceUpdate__ = false;
            return;
          }
          this.render();
        }
      },
    },
  },

  data: {
    dpr: 0,

    canvasWidth: 0,
    canvasHeight: 0,

    originLabels: [] as any[],
    currentLabels: [] as any[],

    rendered: false,

    initialMovableArea: {
      left: 0,
      top: 0,
    },
    movableArea: {
      left: 0,
      top: 0,
      scale: 1,
    },

    canvasNodes: {
      image: { canvas: null, ctx: null },
      rect: { canvas: null, ctx: null },
      hljs: { canvas: null, ctx: null },
    },
    basicLayout: {
      width: 0,
      height: 0,
      scale: { x: 0, y: 0 },
      offsetTop: 0,
      offsetLeft: 0,
    },
  },

  methods: {
    async init() {
      const { pixelRatio } = wx.getSystemInfoSync();

      this.setData({
        dpr: pixelRatio,
      });

      await this.initLayout();

      this.render();
    },
    async initLayout() {
      const { image } = this.data;

      await this.computeLayoutSize(image);

      this.drawImageLayout(image);

      await this.drawRectLayout();
    },

    render() {
      this.setData({
        rendered: false,
      });

      const { labels, canvasNodes } = this.data;

      const finalLabels = this.normalizeLabels(labels);

      this.setData({
        originLabels: finalLabels,
      });

      this.drawRectLabels({
        labels: finalLabels,
        canvasNode: canvasNodes.rect,
      });

      this.setData(
        {
          rendered: true,
        },
        execute
      );
    },

    // 计算画布尺寸
    async computeLayoutSize(image) {
      const {
        width: maxWidth,
        height: maxHeight,
        top,
        left,
      } = await selectorQuery('#J-analysis-wrap', this);

      const { width: imageWidth, height: imageHeight } = image;
      const { width, height, scale } = computeLayout(
        maxWidth,
        maxHeight,
        imageWidth,
        imageHeight
      );

      const offsetLeft = (maxWidth - width) / 2;
      const offsetTop = (maxHeight - height) / 2;

      this.setData({
        canvasWidth: width,
        canvasHeight: height,
        initialMovableArea: {
          left: offsetLeft,
          top: offsetTop,
        },
        movableArea: {
          left: offsetLeft,
          top: offsetTop,
          scale: 1,
        },
        basicLayout: {
          width,
          height,
          scale,
          offsetTop: top,
          offsetLeft: left,
        },
      });
    },

    // 绘制图片布局
    async drawImageLayout(image) {
      const { dpr, basicLayout } = this.data;
      const { width, height } = basicLayout;

      wx.showLoading({
        title: '图片加载中',
      });

      try {
        const { canvas, ctx } = await drawLayout(
          {
            dpr,
            width,
            height,
            selector: '#J-image-canvas',
          },
          this
        );

        this.setData({
          'canvasNodes.image': { canvas, ctx },
        });

        const img = canvas.createImage();

        img.src = await getRealPath(image.image_url);

        img.onload = () => {
          wx.hideLoading();

          moutedExecute();

          ctx.drawImage(img, 0, 0, width, height);
        };
      } catch (error) {
        wx.hideLoading();

        moutedExecute();

        wx.showToast({
          title: '图片加载失败',
        });
        console.log(error);
      }
    },

    // 绘制矩形布局
    async drawRectLayout() {
      const { dpr, basicLayout } = this.data;
      const { width, height } = basicLayout;

      try {
        const rectCanvasAns = await drawLayout(
          {
            dpr,
            width,
            height,
            selector: '#J-rect-canvas',
          },
          this
        );

        this.setData({
          'canvasNodes.rect': rectCanvasAns,
        });

        const hljsCanvasAns = await drawLayout(
          {
            dpr,
            width,
            height,
            selector: '#J-hljs-canvas',
          },
          this
        );

        this.setData({
          'canvasNodes.hljs': hljsCanvasAns,
        });
      } catch (error) {
        console.log(error);
      }
    },

    // 标准化数据
    normalizeLabels(labels) {
      const { basicLayout, colors } = this.data;
      const {
        scale: { x, y },
      } = basicLayout;

      return (labels || []).map((label) => {
        const { width, height, top, left } = label;

        return {
          ...label,
          color: colors[label.status],
          _left: left / x,
          _top: top / y,
          _width: width / x,
          _height: height / y,
        };
      });
    },

    /**
     * @description 绘制矩形区域
     * @property {array} - labels
     * @property {canvas} - canvasNode
     * @property {function} - beforeDraw
     * @property {function} - drawing
     */
    drawRectLabels(options) {
      const { labels, canvasNode, beforeDraw, drawing } = options;
      const { ctx } = canvasNode;
      const { width, height } = this.data.basicLayout;

      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      beforeDraw && beforeDraw.call(this, ctx);

      const drawingItem = (label) => {
        const { _width, _height, _top, _left, color } = label;

        ctx.lineWidth = 2;
        ctx.strokeStyle = color;

        if (drawing) {
          drawing(ctx, label);
        } else {
          ctx.strokeRect(_left, _top, _width, _height);
        }
      };

      if (Array.isArray(labels)) {
        labels.forEach(drawingItem);
        this.setData({
          currentLabels: labels as any[],
        });
      } else {
        console.log('draw rect labels failed.');
      }
    },

    // 触摸区域拖动
    handleMoveableChange(e) {
      const { x, y } = e.detail;
      const { movableArea } = this.data;

      this.setData({
        movableArea: {
          ...movableArea,
          left: x,
          top: y,
        },
      });
    },

    // 触摸区域缩放
    handleMoveableScaheChange(e) {
      const { scale, x, y } = e.detail;
      const { movableArea } = this.data;

      this.setData({
        movableArea: {
          ...movableArea,
          scale,
          left: x,
          top: y,
        },
      });
    },

    // 矩形框点击
    handleRectLabelsClick(e) {
      const { x, y } = e.detail;
      const { originLabels, movableArea, basicLayout } = this.data;
      const { top, left, scale } = movableArea;
      const { offsetTop, offsetLeft } = basicLayout;

      const targetX = x - left - offsetLeft;
      const targetY = y - top - offsetTop;

      for (let i = 0; i < originLabels.length; i++) {
        const label = originLabels[i];
        const { _top, _left, _width, _height } = label;

        if (
          targetX > _left * scale &&
          targetX < (_left + _width) * scale &&
          targetY > _top * scale &&
          targetY < (_top + _height) * scale
        ) {
          this.triggerEvent('click', { ...label, index: i } as any);
        }
      }
    },

    // 按层筛选
    update(options) {
      callbacks.push(() => {
        const { filterExp, shadow = false } = options;
        const { originLabels, basicLayout, canvasNodes } = this.data;
        const { width, height } = basicLayout;

        const labels = originLabels.filter(filterExp);
        const isLayer = shadow || labels.length < originLabels.length;
        const canvasNode = isLayer ? canvasNodes.hljs : canvasNodes.rect;

        let funcOptions = {};

        if (isLayer) {
          funcOptions = {
            beforeDraw(ctx) {
              const grad = ctx.createLinearGradient(0, 0, 0, height);

              grad.addColorStop(0, 'rgba(0, 0, 0, .4)');
              grad.addColorStop(1, 'rgba(0, 0, 0, .6)');

              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, width, height);
            },
            drawing(ctx, { _left, _top, _width, _height }) {
              ctx && ctx.clearRect(_left, _top, _width, _height);
              ctx && ctx.strokeRect(_left, _top, _width, _height);
            },
          };
        } else {
          funcOptions = {
            beforeDraw() {
              const { canvasNodes } = (this as { data: any }).data;
              canvasNodes.hljs.ctx.clearRect(0, 0, width, height);
            },
          };
        }

        this.drawRectLabels({ labels, canvasNode, ...funcOptions });
      });

      if (this.data.rendered) execute();
    },

    // 注册渲染完毕的回调函数
    registerCallbacks(fn, options) {
      const { mouted, rendered, force } = options;

      if (mouted) {
        mountedCallbacks.push(fn);
      }
      if (rendered) {
        callbacks.push(fn);
      }
      if (force) {
        __forceUpdate__ = true;
      }
    },
  },
});
