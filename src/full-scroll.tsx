/*
 * @Author: ChangJun Hong
 * @Date: 2020-12-25 16:30:37
 * @Last Modified time: 2020-12-25 16:30:37
 * @Title：全屏滚动组件
 * @Prop：{
 *    children: 内容,
 *    [activeKey]: 当前激活的页面key 暂不支持,
 *    [defaultKey]: 默认key default '',
 *    [className]: {String} 自定义类名,
 *    [direction]: 全屏滑动方向 default vertical,
 *    [addEventToDocument]: 是否将事件添加到document元素上,
 *    [onReachBorder]: 到达边界事件,
 *    [onChange]: key值变更事件,
 *    [disabledMouseScroll]: {Boolean} 是否禁用鼠标滚轮滚动事件 default false
 * }
 */


import React, { Component } from 'react';
import FullScrollItem from './full-scroll-item';
import { LoopPromise } from './util';
import './full-scroll.scss';

interface FullScrollProps {
  children: any;
  defaultKey?: string;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  transitionTime?: number;
  toggleClassTime?: number;
  addEventToDocument?: boolean;
  onReachBorder?: (direction: string) => void;
  onChange?: (key: string) => void;
  onTransitionEnd?: (key: string) => void;
  disabledMouseScroll?: boolean;
}

class FullScroll extends Component<FullScrollProps, any> {
  static Item = FullScrollItem;
  static defaultProps = {
    addEventToDocument: false,
    direction: 'vertical',
    defaultKey: '',
    transitionTime: 1000,
    toggleClassTime:  50,
    disabledMouseScroll: false
  };
  activeClass = 'full-scroll-item-component-active';
  hideClass = 'full-scroll-item-component-hide';
  classOfTop = 'full-scroll-item-component-on-top';
  classOfBottom = 'full-scroll-item-component-on-bottom';
  classOfLeft = 'full-scroll-item-component-on-left';
  classOfRight = 'full-scroll-item-component-on-right';
  containerRef: any = null;
  constructor(props) {
    super(props);
    const { transitionTime } = props;
    const defaultKeyInfo = this.getDefaultCurrentKey();
    this.state = {
      isFireFox: this.checkIsFireFox(),                         // 当前是否为火狐浏览器
      eventType: null,                                          // 鼠标滚轮滚动事件类型，浏览器不同则可能不同
      eventTarget: null,                                        // 滚轮滚动事件的目标，默认为组件根节点，可通过 addEventToDocument 改为document
      isScrolling: false,                                       // 是否正在滚动
      currentKey: defaultKeyInfo.key,                           // 当前激活的key
      currentIndex: defaultKeyInfo.index,                       // 当前激活的index
      transitionDuration: `${transitionTime / 1000}s`,          // 过渡动画时长
    }
  }

  componentWillMount() {
    this.checkChildren();
  }

  componentDidMount() {
    this.setCurrentScreen();
    this.setEvent();
  }

  // componentDidUpdate(beforeProps) {
  //   const { activeKey: newKey } = this.props;
  //   const { activeKey: oldKey } = beforeProps;
  //   const { isScrolling } = this.state;
  //   if (newKey !== oldKey && !isScrolling) this.updateScreen(newKey, oldKey);
  // }

  componentWillUnmount() {
    const { eventType, eventTarget } = this.state
    if (eventTarget) {
      eventTarget.removeEventListener(eventType, this.scrollMouseEvent)
    }
  }

  private getDefaultCurrentKey = () => {
    const { defaultKey, children } = this.props;
    let key: any = '';
    let index = -1;
    if (children && children.length) {
      key = children[0].key;
      index = 0;
      const matchIndex = children.findIndex(child => child.key === defaultKey);
      if (matchIndex > -1) {
        key = defaultKey;
        index = matchIndex;
      }
    }
    return {
      key,
      index
    };
  }

  // 判断子元素是否合法
  private checkChildren = () => {
    const { children } = this.props;
    children.forEach(child => {
      if (child.type !== FullScrollItem) throw new Error('full-scroll的子元素必须为full-scroll-item');
    });
  };

  // 判断是否火狐浏览器
  private checkIsFireFox = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /firefox/.test(userAgent);
  };

  // 注册全屏滚动事件
  private setEvent = () => {
    const { containerRef } = this;
    const { addEventToDocument } = this.props;
    const { isFireFox } = this.state;
    const eventType = isFireFox ? 'DOMMouseScroll' : 'mousewheel';
    const eventTarget = addEventToDocument ? document : containerRef;
    if (eventTarget) {
      eventTarget.addEventListener(eventType, this.scrollMouseEvent)
      this.setState({
        eventType,
        eventTarget,
      });
    }
  };

  // 设置默认屏幕
  private setCurrentScreen = () => {
    const { children } = this.props;
    const { currentKey } = this.state;
    const currentIndex = children.findIndex(child => child.key === currentKey);
    // 只有找到元素才做设置
    const childrenElements = (this.containerRef && this.containerRef.children) || null;
    if (currentIndex > -1 && childrenElements) {
      [...childrenElements].forEach((child: any, index: number) => {
        const className = currentIndex === index ? this.activeClass : this.hideClass;
        child.classList.add(className);
      })
    }
  };

  // 获取滚轮滚动的方向
  private getMouseScrollDirection = event => {
    const { isFireFox } = this.state;
    const { wheelDeltaY, detail } = event;
    const topText = 'top';
    const bottomText = 'bottom';
    if (isFireFox) return detail > 0 ? bottomText : topText;
    return wheelDeltaY > 0 ? topText : bottomText;
  };

  // 滚动鼠标滚轮事件
  private scrollMouseEvent = (event) => {
    const { disabledMouseScroll } = this.props;
    const { currentKey, isScrolling } = this.state;
    if (disabledMouseScroll) return;
    // 防抖
    if (isScrolling) return;
    const { children, onReachBorder } = this.props;
    const keyList = children.map(child => child.key);
    const currentIndex = keyList.findIndex(key => key === currentKey);
    const direction = this.getMouseScrollDirection(event);
    // 只有匹配到key才做滚动
    if (currentIndex > -1) {
      if ((currentIndex === 0 && direction === 'top') || (currentIndex === (children.length - 1) && direction === 'bottom')) {
        return onReachBorder && onReachBorder(direction);
      }
      const nextIndex = direction === 'top' ? (currentIndex - 1) : (currentIndex + 1);
      const nextKey = children[nextIndex].key;
      this.setState({ currentKey: nextKey }, () => {
        this.startToggleScreen(direction, nextIndex, currentIndex)
      });
    } else {
      // throw new Error('没有匹配到当前key');
      console.log(`没有匹配到当前key:${currentKey}`, currentKey)
    }
  }

  // 开始切换屏幕
  private startToggleScreen = (direction: 'top' | 'bottom', nextIndex: number, currentIndex: number) => {
    this.setState({ isScrolling: true }, () => {
      const { toggleClassTime, direction: transitionDirection } = this.props;
      const { transitionDuration } = this.state;
      const childrenElement = this.containerRef.children;
      const nextElement: any = childrenElement[nextIndex];
      const currentElement: any = childrenElement[currentIndex];
      const transitionProperty = transitionDirection === 'vertical' ? 'top' : 'left';
      let nextElementNewClassName;
      let currentElementNewClassName;
      if (transitionDirection === 'vertical' && direction === 'bottom') {
        nextElementNewClassName = this.classOfBottom;
        currentElementNewClassName = this.classOfTop;
      } else if (transitionDirection === 'vertical' && direction === 'top') {
        nextElementNewClassName = this.classOfTop;
        currentElementNewClassName = this.classOfBottom;
      } else if (transitionDirection === 'horizontal' && direction === 'bottom') {
        nextElementNewClassName = this.classOfRight;
        currentElementNewClassName = this.classOfLeft;
      } else {
        nextElementNewClassName = this.classOfLeft;
        currentElementNewClassName = this.classOfRight;
      }
      new LoopPromise()
          .push(() => {
            currentElement.classList.remove(this.activeClass);
            currentElement.classList.remove(this.hideClass);
            nextElement.classList.remove(this.hideClass);
            nextElement.classList.add(nextElementNewClassName);
            nextElement.classList.add(this.activeClass);
          })
          .push(() => {
            const transition = `${transitionProperty} ${transitionDuration}`
            currentElement.style.transition = transition;
            nextElement.style.transition = transition;
            this.setTransitionEndEvent(nextElement, currentElement, nextIndex, currentIndex, currentElementNewClassName);
          }, toggleClassTime)
          .push(() => {
            currentElement.classList.add(currentElementNewClassName);
            nextElement.classList.remove(nextElementNewClassName);
          }, toggleClassTime)
          .start();
    });
  };

  // 设置过渡事件
  private setTransitionEndEvent = (nextElement, currentElement, nextIndex: number, currentIndex: number, currentElementNewClassName: string) => {
    const { children, onTransitionEnd } = this.props;
    const instance = this;
    const eventType = 'transitionend';
    const transitionEvent = function(event) {
      if (event.target === nextElement) {
        nextElement.style.transition = '';
        currentElement.style.transition = '';
        currentElement.classList.add(instance.hideClass);
        currentElement.classList.remove(currentElementNewClassName);
        nextElement.removeEventListener(eventType, transitionEvent);
        const lastKey = children[nextIndex].key;
        instance.setState({
          currentKey: lastKey,
          currentIndex: nextIndex,
          isScrolling: false
        }, () => {
          onTransitionEnd && onTransitionEnd(lastKey);
        });
      }
    };
    nextElement.addEventListener(eventType, transitionEvent);
  };

  // 切换到指定屏幕
  private toggleScreen = (key: string) => {
    const { currentKey } = this.state;
    this.updateScreen(key, currentKey);
  };

  private nextScreen = () => {
    this.toggleRoundScreen(true);
  };

  private prevScreen = () => {
    this.toggleRoundScreen(false);
  };

  private toggleRoundScreen = (isNext: boolean) => {
    const { children } = this.props;
    const { currentIndex } = this.state;
    const nextIndex = isNext ? (currentIndex + 1) : (currentIndex - 1);
    const nextKey = (children[nextIndex] && children[nextIndex].key);
    if (nextKey) this.toggleScreen(nextKey);
  }

  // 更新屏幕内容
  private updateScreen = (newKey: string | undefined, oldKey: string) => {
    const { children } = this.props;
    const { isTransition } = this.state;
    if (isTransition) return;
    const keyList = children.map(child => child.key);
    const newIndex = keyList.findIndex(key => key === newKey);
    const oldIndex = keyList.findIndex(key => key === oldKey);
    // 没有匹配到key,不进行操作
    if (newIndex < 0 || oldIndex < 0) return;
    this.startToggleScreen(newIndex > oldIndex ? 'bottom' : 'top', newIndex, oldIndex);
  }

  render() {
    const { children, className } = this.props;
    let realClass = 'full-scroll-component';
    if (className) realClass += ` ${className}`;
    return (
      <div
        className={realClass}
        ref={ ref => this.containerRef = ref }
      >
        { children }
      </div>
    )
  }
};

export default FullScroll;