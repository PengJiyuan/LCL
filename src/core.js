import polyfill from './utils/polyfill';
import { version } from '../package.json';
import { Event } from './event';
import { Color } from './utils/color';
import { ImageLoader } from './utils/imageLoader';
import utils from './utils/helpers';
import shapes from './shapes/index';

export class LCL {

  constructor(config) {

    this.version = version;

    this.objects = [];

    this.transX = 0;

    this.transY = 0;

    this.scale = 1;

    // the instance of image loader
    this.loader = null;

    this.pointerInnerArray = [];

    this.isDragging = false;

    // support event types
    this.eventTypes = [
      'mousedown',
      'mouseup',
      'mouseenter',
      'mouseleave',
      'mousemove',
      'drag',
      'dragend',
      'dragin',
      'dragout',
      'drop'
    ];

    this._event = new Event(this);

    this.color = new Color();

    this.element = config.element;

    this.canvas =  this.element.getContext('2d');

    // init the width and height
    this.element.width = this.width = config.width;

    this.element.height = this.height = config.height;

    this.enableGlobalTranslate = config.enableGlobalTranslate || false;

    // init images
    this.images = config.images || [];

    Object.keys(shapes).forEach(shape => {
      this[shape] = function(settings) {
        return shapes[shape](settings, this);
      }
    });

  }

  imgReady() {
    this.loader = new ImageLoader();
    this.loader.addImg(this.images);
  }

  addChild(obj) {
    // multi or single
    if(utils.isArr(obj)) {
      this.objects = this.objects.concat(obj);
    } else {
      this.objects.push(obj);
    }
    this.objects.sort((a, b) => {
      return a.zindex - b.zindex;
    });
    // copy the reverse events array
    this._objects = utils.reverse(this.objects);
  }

  show() {
    const _this = this;
    this.imgReady();
    this.loader.ready(() => {
      _this.draw();
      _this._event.triggerEvents();
    });
  }

  draw() {
    this.objects.forEach(item => {
      item.draw();
    });
  }

  redraw() {
    this.clear();
    this.canvas.save();
    this.canvas.translate(this.transX, this.transY);
    this.draw();
    this.canvas.restore();
  }

  clear() {
    this.canvas.clearRect(0, 0, this.width, this.height);
  }

  animate(func) {
    this._event.triggerEvents();
    const id = new Date().getTime();
    const _func = () => {
      func();
      this[id] = requestAnimationFrame(_func);
    };
    _func();
    return id;
  }

  stop(id) {
    cancelAnimationFrame(this[id]);
  }

  globalTranslate(bool) {
    if(typeof bool !== 'boolean' || !bool) {
      return;
    }
    this.enableGlobalTranslate = true;
  }

  getVersion() {
    return this.version;
  }

  scaleCanvas(bool) {
    if(typeof bool !== 'boolean' || !bool) {
      return;
    }
    const that = this;
    utils.bind(this.element, 'wheel', function(e) {
      if(e.deltaY < 0) {
        if(that.scale <= 3) {
          that.scale += 0.02;
          that.redraw();
        }
      } else {
        if(that.scale > 0.5) {
          that.scale -= 0.02;
          that.redraw();
        }
      }
    });
  }

}
