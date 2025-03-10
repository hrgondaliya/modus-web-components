import {
  h, // eslint-disable-line @typescript-eslint/no-unused-vars
  Component,
  Prop,
  Element,
  Watch,
  EventEmitter,
  Event,
  Listen,
  State,
} from '@stencil/core';
import { ModusSideNavigationItemCustomEvent } from '../../components';
import { IconChevronLeftThick } from '../icons/icon-chevron-left-thick';
import { ModusSideNavigationTree } from './modus-side-navigation-tree';
import {
  ModusSideNavigationItemInfo,
  ModusSideNavigationLevelInfo,
} from './modus-side-navigation.types';

@Component({
  tag: 'modus-side-navigation',
  styleUrl: 'modus-side-navigation.scss',
  shadow: true,
})
export class ModusSideNavigation {
  @Element() element: HTMLElement;

  /** (optional) Data property to create the items. */
  @Prop() data: ModusSideNavigationItemInfo[];

  /** (optional) Maximum width of the side navigation panel in an expanded state. */
  @Prop() maxWidth = '256px';

  /** Mode to make side navigation either overlay or push the content for the selector specified in `targetContent` */
  @Prop() mode: 'overlay' | 'push' = 'overlay';

  /** (optional) The expanded state of side navigation panel and items. */
  @Prop({ mutable: true, reflect: true }) expanded = false;

  /** (optional) Specify the selector for the page's content for which paddings and margins will be set by side navigation based on the `mode`. */
  @Prop() targetContent: string;

  /** An event that fires on side navigation panel collapse & expand.  */
  @Event() sideNavExpand: EventEmitter<boolean>;

  private _callbackQueue: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  private _children: { [key: string]: HTMLModusSideNavigationItemElement } = {};
  private _firstChild: string;
  private _itemInFocus: string;
  private _itemSelected: string;
  private _minWidth = '4rem';
  private _levelsContainerRef: HTMLDivElement;
  private _retainFocus = false;
  private _timeout: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  @State() _navigationLevelInfo: ModusSideNavigationLevelInfo[] = [];

  componentDidRender() {
    // Execute the callbacks on Render
    // Be careful with updating states in these callbacks to avoid infinite looping
    if (this._callbackQueue?.length) {
      this._callbackQueue.forEach((callbackFn) => callbackFn && callbackFn());
    }
    this._callbackQueue = [];
  }

  componentWillLoad() {
    this.handleExpandedChange(this.expanded);

    // If data prop is set, get the level1 info
    this.initializeLevelInfo(this.data);
  }

  @Listen('click', { target: 'document' })
  documentClickHandler(event: MouseEvent): void {
    if (
      this.element.contains(event.target as HTMLElement) ||
      event.defaultPrevented
    )
      return;

    // Collapse when clicked outside
    this.expanded = false;
  }

  getNextLevel(id: string) {
    if (this._navigationLevelInfo?.length) {
      const existingLevelItems =
        this._navigationLevelInfo[this._navigationLevelInfo.length - 1]
          .children;

      return existingLevelItems?.find((i) => i.id === id);
    }

    return null;
  }

  gotoNextLevel(id: string): boolean {
    if (this._navigationLevelInfo?.length) {
      const level = this.getNextLevel(id);
      if (level?.children) {
        const newLevels = [...(this._navigationLevelInfo || [])];
        newLevels.push({ ...level, slidePosition: 'right' });

        this._navigationLevelInfo = [...newLevels];
        this.expanded = true;

        // Animation for sliding levels
        this._callbackQueue.push(() => {
          const levels = [...this._navigationLevelInfo];
          levels.forEach((level, index) => {
            if (index === levels.length - 2) {
              level.slidePosition = 'left';
            } else if (index === levels.length - 1) {
              level.slidePosition = 'center';
            }
          });
          this._navigationLevelInfo = [...levels];
          this._retainFocus = true;
        });

        return true;
      }
    }
    return false;
  }

  gotoPreviousLevel(): boolean {
    if (
      !this._navigationLevelInfo?.length ||
      this._navigationLevelInfo?.length === 1
    )
      return false;
    const levels = [...this._navigationLevelInfo];

    // Animation for sliding levels
    levels.forEach((level, index) => {
      if (levels.length > 1) {
        if (index === levels.length - 2) {
          level.slidePosition = 'center';
        } else if (index === levels.length - 1) {
          level.slidePosition = 'right';
        }
      } else {
        level.slidePosition = 'center';
      }
    });
    this._navigationLevelInfo = [...levels];

    this._callbackQueue.push(() => {
      this._timeout = setTimeout(() => {
        levels.pop();
        this._navigationLevelInfo = [...levels];
        this._retainFocus = true;

        clearTimeout(this._timeout);
      }, 250);
    });
    return true;
  }

  @Listen('_sideNavItemAdded')
  handleItemAdded(event: ModusSideNavigationItemCustomEvent<HTMLElement>) {
    if (event.detail?.id) {
      this._children[event.detail.id] =
        event.detail as HTMLModusSideNavigationItemElement;
      this._children[event.detail.id].expanded = this.expanded;
    }
    this.itemChanged(event);
  }

  @Listen('_sideNavItemRemoved')
  handleItemRemoved(event: ModusSideNavigationItemCustomEvent<HTMLElement>) {
    if (event.detail?.id) {
      delete this._children[event.detail.id];
    }
    this.itemChanged(event);
  }

  @Listen('sideNavItemFocus')
  handleItemFocus(event: ModusSideNavigationItemCustomEvent<{ id: string }>) {
    this.setFocusItem(event.detail.id);
  }

  @Listen('sideNavItemClicked')
  handleItemClick(
    event: ModusSideNavigationItemCustomEvent<{ id: string; selected: boolean }>
  ) {
    if (!this.gotoNextLevel(event.detail.id)) {
      if (this._itemSelected) {
        this._children[this._itemSelected].selected = false;
        this._itemSelected = null;
      }
      this._itemSelected = event.detail.selected ? event.detail.id : null;
    }
  }

  @Watch('data')
  handleDataChange(val) {
    this.initializeLevelInfo(val);
    this.handleExpandedChange(this.expanded);
  }

  @Watch('expanded')
  handleExpandedChange(isExpanded) {
    const updateChildren = () => {
      Object.values(this._children).forEach((c) => (c.expanded = isExpanded));
    };
    const updateContent = () => {
      this.setTargetContentMargin(isExpanded, this.mode, this.targetContent);
    };

    const emitEvent = () => {
      this.sideNavExpand?.emit(this.expanded);
    };

    const levelHeadings = this._levelsContainerRef?.querySelector(
      '.side-nav-level.center .level-headings'
    ) as HTMLElement;

    // Animation when hiding/showing back button and level heading
    if (this._navigationLevelInfo?.length && levelHeadings) {
      if (isExpanded) {
        levelHeadings.classList.remove('collapse');
        levelHeadings.classList.add('collapsing');
        levelHeadings.style.height = '0';

        this._timeout = setTimeout(() => {
          levelHeadings.classList.remove('collapsing');
          levelHeadings.classList.add('show');
          levelHeadings.style.height = '';
          clearTimeout(this._timeout);
          updateChildren();
          emitEvent();
        }, 150);
        levelHeadings.style.height = `${levelHeadings.scrollHeight}px`;
        updateContent();
      } else {
        updateChildren();
        levelHeadings.style.height = `${
          levelHeadings.getBoundingClientRect().height
        }px`;
        this.reflow(levelHeadings);
        levelHeadings.classList.add('collapsing');

        // Timeout to reset collapsing class
        this._timeout = setTimeout(() => {
          levelHeadings.classList.add('collapse');
          levelHeadings.classList.remove('show');
          levelHeadings.classList.remove('collapsing');

          clearTimeout(this._timeout);
          emitEvent();
        }, 300);

        levelHeadings.style.height = '0px';
        updateContent();
      }
    } else {
      updateChildren();
      updateContent();
      emitEvent();
    }
  }

  @Watch('mode')
  handleModeChange(mode) {
    this.setTargetContentMargin(this.expanded, mode, this.targetContent);
  }

  @Watch('targetContent')
  handleTargetChange(target) {
    this.setTargetContentMargin(this.expanded, this.mode, target);
  }

  handleBackClick(e: KeyboardEvent | MouseEvent): void {
    const code = e['code']?.toUpperCase();

    if (code) {
      if (code === 'ENTER' || code === 'SPACE') {
        this.gotoPreviousLevel();
      }
    } else this.gotoPreviousLevel();

    e.stopPropagation();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return; // Do nothing if event already handled
    }
    const key = event.code.toUpperCase();
    let preventDefault = false;
    // If the tree is empty there will be no child
    if (event.altKey || !this._firstChild) {
      return;
    }
    switch (key) {
      case 'SPACE':
      case 'ENTER':
        event.stopPropagation();
        break;
      case 'ARROWDOWN':
        // eslint-disable-next-line no-case-declarations
        const nextItem: HTMLModusSideNavigationItemElement = this._children[
          this._itemInFocus
        ]?.nextElementSibling as HTMLModusSideNavigationItemElement;

        nextItem?.focusItem();
        preventDefault = true;
        break;
      case 'ARROWUP':
        // eslint-disable-next-line no-case-declarations
        const prevItem = this._children[this._itemInFocus]
          ?.previousElementSibling as HTMLModusSideNavigationItemElement;

        prevItem?.focusItem();
        preventDefault = true;
        break;
      case 'ARROWRIGHT':
        if (this.expanded) this.gotoNextLevel(this._itemInFocus);
        break;
      case 'ARROWLEFT':
        if (this.expanded) this.gotoPreviousLevel();
        break;
      default:
    }

    if (preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  handleLevelsContainerRef(el: HTMLDivElement) {
    this._levelsContainerRef = el;

    // Workaround to retain focus on the component in specific cases
    // Like going back to a level, the component loses focus
    if (this._retainFocus) el.focus();
    this._retainFocus = false;
  }

  handleLevelHeadingRef(el: HTMLDivElement) {
    // Retain focus on the current level headings
    el?.focus();
  }

  initializeLevelInfo(data: ModusSideNavigationItemInfo[]) {
    if (data?.length) {
      this._navigationLevelInfo = [
        {
          id: null,
          label: null,
          children: data,
          slidePosition: 'center',
        },
      ];
    } else this._navigationLevelInfo = null;
  }

  itemChanged(event: ModusSideNavigationItemCustomEvent<HTMLElement>) {
    const keys = Object.keys(this._children);
    this._firstChild = keys[0];

    event.preventDefault();
    event.stopPropagation();
  }

  setTargetContentMargin(isExpanded: boolean, mode: string, target: string) {
    const content = document.querySelector(target) as HTMLElement;
    if (content) {
      content.style.marginLeft =
        isExpanded && mode === 'push' ? this.maxWidth : this._minWidth;
    }
  }

  setFocusItem(itemId: string): void {
    this._itemInFocus = itemId;
  }

  // Trick to restart an element's animation
  // see https://www.charistheo.io/blog/2021/02/restart-a-css-animation-with-javascript/#restarting-a-css-animation
  // taken from: https://getbootstrap.com/docs/5.2/dist/js/bootstrap.js
  reflow = (element) => {
    element.offsetHeight; // eslint-disable-line no-unused-expressions
  };

  render() {
    return (
      <nav
        role="navigation"
        class={`side-nav-panel${this.expanded ? ' expanded' : ''}`}
        style={{ width: this.expanded ? this.maxWidth : null }}
        onKeyDown={(e) => this.handleKeyDown(e)}
        aria-label="side navigation">
        {this.data ? (
          <div tabindex={-1} ref={(el) => this.handleLevelsContainerRef(el)}>
            {this._navigationLevelInfo.map((level, index) => (
              <div class={`side-nav-level ${level.slidePosition}`}>
                {index !== 0 && (
                  <div
                    class="level-headings"
                    {...(level.slidePosition === 'center'
                      ? {
                          tabindex: 0,
                          ref: (el) => this.handleLevelHeadingRef(el),
                        }
                      : {})}>
                    <p>
                      <IconChevronLeftThick size="10" />
                      <a
                        tabIndex={0}
                        onClick={(e) => this.handleBackClick(e)}
                        onKeyDown={(e) => this.handleBackClick(e)}>
                        Back
                      </a>
                    </p>

                    <h4>{level.label}</h4>
                  </div>
                )}
                <div>
                  <ul class="side-nav-menu" role="tree">
                    <ModusSideNavigationTree
                      data={level.children}
                      itemSelected={this._itemSelected}
                      tabIndex={
                        level.slidePosition === 'center' ? undefined : -1
                      }></ModusSideNavigationTree>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="side-nav-level center">
            <ul class="side-nav-menu" role="tree">
              <slot></slot>
            </ul>
          </div>
        )}
      </nav>
    );
  }
}
