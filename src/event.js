import utils from './utils/helpers';

export class Event {
  constructor(_this) {
    // global this
    this._ = _this;
  }

  getPos(e) {
    const ev = e || event;
    const [ x, y ] = [ ev.pageX - this._.element.offsetLeft, ev.pageY - this._.element.offsetTop ];
    return { x, y };
  }

  triggerEvents() {
    const hasEvents = this._.objects.some(item => {
      return item.events && utils.isArr(item.events) || item.enableDrag;
    });
    if(!hasEvents && !this._.enableGlobalTranslate) {
      return;
    }

    const hasEnterOrMove = this._.objects.some(item => {
      return item.events && item.events.some(i => {
        return i.eventType === 'mouseenter' || i.eventType === 'mousemove';
      });
    });

    // mouseenter mousemove
    if(hasEnterOrMove) {
      this.mouseEnterOrMove();
    }

    utils.bind(this._.element, 'mousedown', this.mouseDown.bind(this));
  }

  mouseEnterOrMove() {
    const that = this;
    let isDragging;
    utils.bind(this._.element, 'mousemove', e_moveOrEnter => {
      const mX = that.getPos(e_moveOrEnter).x;
      const mY = that.getPos(e_moveOrEnter).y;

      isDragging = that._.objects.some(item => {
        return item.isDragging;
      });

      // trigger mouseenter and mousemove
      const movedOn = that._._objects.filter(item => {
        return item.isPointInner(mX, mY);
      });

      if(isDragging) {
        // dragin
        if(movedOn && movedOn.length > 1) {
          movedOn[1].events && movedOn[1].events.forEach(i => {
            if(i.eventType === 'dragin' && !movedOn[1].hasDraggedIn) {
              movedOn[1].hasDraggedIn = true;
              i.callback && i.callback();
            }
          });
        }

        // dragout handler
        const handleDragOut = item => {
          item.hasDraggedIn && item.events.forEach(i => {
            if(i.eventType === 'dragout') {
              i.callback && i.callback();
            }
          });
          item.hasDraggedIn = false;
        };

        // Determine whether the mouse is dragged out from the shape and trigger dragout handler
        that._._objects.some(item => {
          return item.hasDraggedIn && (!item.isPointInner(mX, mY) || movedOn[1] !== item) && handleDragOut(item);
        });

      } else {
        // normal mousemove
        if(movedOn && movedOn.length > 0) {
          movedOn[0].events && movedOn[0].events.forEach(i => {
            if(i.eventType === 'mouseenter' && !movedOn[0].hasEnter) {
              movedOn[0].hasEnter = true;
              i.callback && i.callback();
            } else if(i.eventType === 'mousemove') {
              i.callback && i.callback();
            }
          });
        }
        // mouseleave handler
        const handleMoveOut = item => {
          item.hasEnter && item.events.forEach(i => {
            if(i.eventType === 'mouseleave') {
              i.callback && i.callback();
            }
          });
          item.hasEnter = false;
        };

        // Determine whether the mouse is removed from the shape and trigger mouseleave handler
        that._._objects.some(item => {
          return item.hasEnter && (!item.isPointInner(mX, mY) || movedOn[0] !== item) && handleMoveOut(item);
        });
      }

    });
  }

  mouseDown(e_down) {
    let that = this, whichIn, hasEventDrag, hasEventDragEnd, dragCb, dragEndCb;
    const hasDrags = this._.objects.some(item => {
      return item.enableDrag;
    });

    // drag shape
    const pX = this.getPos(e_down).x;
    const pY = this.getPos(e_down).y;
    that.cacheX = pX;
    that.cacheY = pY;

    // mousedown
    const whichDown = this._._objects.filter(item => {
      return item.isPointInner(pX, pY);
    });

    if(whichDown && whichDown.length > 0) {
      if(whichDown[0].enableChangeIndex) {
        that.changeOrder(whichDown[0]);
      }
      whichDown[0].events && whichDown[0].events.some(i => {
        return i.eventType === 'mousedown' && i.callback && i.callback();
      });
    }

    // mouseDrag
    if(hasDrags) {
      whichIn = that._._objects.filter(item => {
        return item.isPointInner(pX, pY);
      });

      hasEventDrag = whichIn.length > 0 && whichIn[0].events && whichIn[0].events.some(item => {
        if(item.eventType === 'drag') {
          dragCb = item.callback;
        }
        return item.eventType === 'drag';
      });

      hasEventDragEnd = whichIn.length > 0 && whichIn[0].events && whichIn[0].events.some(item => {
        if(item.eventType === 'dragend') {
          dragEndCb = item.callback;
        }
        return item.eventType === 'dragend';
      });

      const move_Event = e_move => {
        const mx = that.getPos(e_move).x;
        const my = that.getPos(e_move).y;

        whichIn[0].moveX = whichIn[0].moveX + mx - that.cacheX;
        whichIn[0].moveY = whichIn[0].moveY + my - that.cacheY;

        // event drag
        hasEventDrag && dragCb();

        that._.redraw();
        that.cacheX = mx;
        that.cacheY = my;
        whichIn[0].isDragging = true;
      };

      const up_Event = e_up => {
        const uX = that.getPos(e_up).x;
        const uY = that.getPos(e_up).y;

        const upOn = that._._objects.filter(item => {
          return item.isPointInner(uX, uY);
        });

        if(upOn && upOn.length > 1) {
          if(upOn[1].hasDraggedIn) {
            upOn[1].hasDraggedIn = false;
            const dp = upOn[1].events.some(i => {
              return i.eventType === 'drop' && i.callback && i.callback(upOn[0]);
            });

            !dp && upOn[1].events.some(i => {
              return i.eventType === 'dragout' && i.callback && i.callback();
            });
          }
        }

        // event dragend
        hasEventDragEnd && dragEndCb();

        utils.unbind(document, 'mousemove', move_Event);
        utils.unbind(document, 'mouseup', up_Event);
        whichIn[0].isDragging = false;
      };
      if(whichIn && whichIn.length > 0 && whichIn[0].enableDrag) {
        utils.bind(document, 'mousemove', move_Event);
        utils.bind(document, 'mouseup', up_Event);
      }
    }

    // global translate
    if(this._.enableGlobalTranslate && !(whichIn && whichIn.length > 0)) {

      const move_dragCanvas = e_move => {
        const mx = that.getPos(e_move).x;
        const my = that.getPos(e_move).y;
        that._.transX = that._.transX + mx - that.cacheX;
        that._.transY = that._.transY + my - that.cacheY;
        that._.redraw();
        that.cacheX = mx;
        that.cacheY = my;
      };

      const up_dragCanvas = () => {
        utils.unbind(document, 'mousemove', move_dragCanvas);
        utils.unbind(document, 'mouseup', up_dragCanvas);
      };

      utils.bind(document, 'mousemove', move_dragCanvas);
      utils.bind(document, 'mouseup', up_dragCanvas);
    }
  }

  changeOrder(item) {
    const i = this._.objects.indexOf(item);
    const cacheData = this._.objects[i];
    this._.objects.splice(i, 1);
    this._.objects.push(cacheData);
    this._._objects = utils.reverse(this._.objects);
    this._.redraw();
  }
}