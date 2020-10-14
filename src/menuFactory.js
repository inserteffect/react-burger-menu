'use strict';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import baseStyles from './baseStyles';
import BurgerIcon from './BurgerIcon';
import CrossIcon from './CrossIcon';

export default styles => {
  class Menu extends Component {
    constructor(props) {
      super(props);
      this.state = {
        isOpen: false
      };

      if (!styles) {
        throw new Error('No styles supplied');
      }
    }

    focusOnFirstMenuItem() {
      const firstItem = Array.from(
        document.getElementsByClassName('bm-item')
      ).shift();
      if (firstItem) {
        firstItem.focus();
      }
    }

    focusOnLastMenuItem() {
      const lastItem = Array.from(
        document.getElementsByClassName('bm-item')
      ).pop();
      if (lastItem) {
        lastItem.focus();
      }
    }

    focusOnCrossButton() {
      const crossButton = document.getElementById('react-burger-cross-btn');
      if (crossButton) {
        crossButton.focus();
      }
    }

    focusOnMenuButton() {
      const menuButton = document.getElementById('react-burger-menu-btn');
      if (menuButton) {
        menuButton.focus();
      }
    }

    focusOnMenuItem(siblingType) {
      if (document.activeElement.className.includes('bm-item')) {
        const sibling = document.activeElement[siblingType];
        if (sibling) {
          sibling.focus();
        } else {
          this.focusOnCrossButton();
        }
      } else {
        if (siblingType === 'previousElementSibling') {
          this.focusOnLastMenuItem();
        } else {
          this.focusOnFirstMenuItem();
        }
      }
    }

    focusOnNextMenuItem() {
      this.focusOnMenuItem('nextElementSibling');
    }

    focusOnPreviousMenuItem() {
      this.focusOnMenuItem('previousElementSibling');
    }

    toggleMenu(options = {}) {
      const { isOpen, noStateChange, focusOnLastItem } = options;
      const newState = {
        isOpen: typeof isOpen !== 'undefined' ? isOpen : !this.state.isOpen
      };

      this.applyWrapperStyles();

      this.setState(newState, () => {
        !noStateChange && this.props.onStateChange(newState);

        if (!this.props.disableAutoFocus) {
          // For accessibility reasons, ensures that when we toggle open,
          // we focus the first or last menu item according to given parameter.
          if (newState.isOpen) {
            focusOnLastItem
              ? this.focusOnLastMenuItem()
              : this.focusOnFirstMenuItem();
          } else {
            if (document.activeElement) {
              document.activeElement.blur();
            } else {
              document.body.blur(); // Needed for IE
            }
          }
        }

        // Timeout ensures wrappers are cleared after animation finishes.
        this.timeoutId && clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          if (!newState.isOpen) {
            this.applyWrapperStyles(false);
          }
        }, 500);
      });
    }

    open() {
      if (typeof this.props.onOpen === 'function') {
        this.props.onOpen();
      } else {
        this.toggleMenu();
      }
    }

    close() {
      if (typeof this.props.onClose === 'function') {
        this.props.onClose();
      } else {
        this.toggleMenu();
      }
    }

    overlayClick() {
      if (
        this.props.disableOverlayClick === true ||
        (typeof this.props.disableOverlayClick === 'function' &&
          this.props.disableOverlayClick())
      ) {
        return;
      } else {
        this.close();
      }
    }

    // Applies component-specific styles to external wrapper elements.
    applyWrapperStyles(set = true) {
      const applyClass = (el, className) =>
        el.classList[set ? 'add' : 'remove'](className);

      if (this.props.htmlClassName) {
        applyClass(document.querySelector('html'), this.props.htmlClassName);
      }
      if (this.props.bodyClassName) {
        applyClass(document.querySelector('body'), this.props.bodyClassName);
      }

      if (styles.pageWrap && this.props.pageWrapId) {
        this.handleExternalWrapper(this.props.pageWrapId, styles.pageWrap, set);
      }

      if (styles.outerContainer && this.props.outerContainerId) {
        this.handleExternalWrapper(
          this.props.outerContainerId,
          styles.outerContainer,
          set
        );
      }
    }

    // Sets or unsets styles on DOM elements outside the menu component.
    // This is necessary for correct page interaction with some of the menus.
    // Throws and returns if the required external elements don't exist,
    // which means any external page animations won't be applied.
    handleExternalWrapper(id, wrapperStyles, set) {
      const wrapper = document.getElementById(id);

      if (!wrapper) {
        console.error("Element with ID '" + id + "' not found");
        return;
      }

      const builtStyles = this.getStyle(wrapperStyles);

      for (const prop in builtStyles) {
        if (builtStyles.hasOwnProperty(prop)) {
          wrapper.style[prop] = set ? builtStyles[prop] : '';
        }
      }

      // Prevent any horizontal scroll.
      // Only set overflow-x as an inline style if htmlClassName or
      // bodyClassName is not passed in. Otherwise, it is up to the caller to
      // decide if they want to set the overflow style in CSS using the custom
      // class names.
      const applyOverflow = el =>
        (el.style['overflow-x'] = set ? 'hidden' : '');
      if (!this.props.htmlClassName) {
        applyOverflow(document.querySelector('html'));
      }
      if (!this.props.bodyClassName) {
        applyOverflow(document.querySelector('body'));
      }
    }

    // Builds styles incrementally for a given element.
    getStyles(el, index, inline) {
      const propName =
        'bm' + el.replace(el.charAt(0), el.charAt(0).toUpperCase());

      // Set base styles.
      let output = baseStyles[el] ? this.getStyle(baseStyles[el]) : {};

      // Add animation-specific styles.
      if (styles[el]) {
        output = {
          ...output,
          ...this.getStyle(styles[el], index + 1)
        };
      }

      // Add custom styles.
      if (this.props.styles[propName]) {
        output = {
          ...output,
          ...this.props.styles[propName]
        };
      }

      // Add element inline styles.
      if (inline) {
        output = {
          ...output,
          ...inline
        };
      }

      // Remove transition if required
      // (useful if rendering open initially).
      if (this.props.noTransition) {
        delete output.transition;
      }

      return output;
    }

    getStyle(style, index) {
      const { width } = this.props;
      const formattedWidth = typeof width !== 'string' ? `${width}px` : width;
      return style(this.state.isOpen, formattedWidth, this.props.right, index);
    }

    listenForKeyDowns(e) {
      e = e || window.event;

      const ARROW_DOWN = 'ArrowDown';
      const ARROW_UP = 'ArrowUp';
      const ENTER = 'Enter';
      const ESCAPE = 'Escape';
      const SPACE = ' ';
      const HOME = 'Home';
      const END = 'End';
      const TAB = 'Tab';

      if (this.state.isOpen) {
        switch (e.key) {
          case ESCAPE:
            // Close on ESC, unless disabled
            if (!this.props.disableCloseOnEsc) {
              this.close();
              this.focusOnMenuButton();
            }
            break;
          case ARROW_DOWN:
            this.focusOnNextMenuItem();
            break;
          case ARROW_UP:
            this.focusOnPreviousMenuItem();
            break;
          case HOME:
            this.focusOnFirstMenuItem();
            break;
          case END:
            this.focusOnLastMenuItem();
            break;
          case TAB:
            this.close();
            break;
        }
      } else {
        // Key downs came from menu button
        if (e.target === document.getElementById('react-burger-menu-btn')) {
          switch (e.key) {
            case ARROW_DOWN:
            case ENTER:
            case SPACE:
              // If down arrow, space or enter, open menu and focus on first menuitem
              this.toggleMenu();
              break;
            case ARROW_UP:
              // If arrow up, open menu and focus on last menuitem
              this.toggleMenu({ focusOnLastItem: true });
              break;
          }
        }
      }
    }

    componentDidMount() {
      this.onKeyDown = this.props.customOnKeyDown
        ? this.props.customOnKeyDown
        : this.listenForKeyDowns.bind(this);

      // Bind keydown handlers (or custom function if supplied).
      window.addEventListener('keydown', this.onKeyDown);

      // Allow initial open state to be set by props.
      if (this.props.isOpen) {
        this.toggleMenu({ isOpen: true, noStateChange: true });
      }
    }

    componentWillUnmount() {
      window.removeEventListener('keydown', this.onKeyDown);

      this.applyWrapperStyles(false);

      // Avoid potentially attempting to update an unmounted component.
      this.timeoutId && clearTimeout(this.timeoutId);
    }

    componentDidUpdate(prevProps) {
      const wasToggled =
        typeof this.props.isOpen !== 'undefined' &&
        this.props.isOpen !== this.state.isOpen &&
        this.props.isOpen !== prevProps.isOpen;
      if (wasToggled) {
        this.toggleMenu();
        // Toggling changes SVG animation requirements, so we defer these until the next componentDidUpdate
        return;
      }

      if (styles.svg) {
        const morphShape = ReactDOM.findDOMNode(this, 'bm-morph-shape');
        const path = styles.svg.lib(morphShape).select('path');

        if (this.state.isOpen) {
          // Animate SVG path.
          styles.svg.animate(path);
        } else {
          // Reset path (timeout ensures animation happens off screen).
          setTimeout(() => {
            path.attr('d', styles.svg.pathInitial);
          }, 300);
        }
      }
    }

    render() {
      return (
        <React.Fragment>
          {!this.props.noOverlay && (
            <div
              className={`bm-overlay ${this.props.overlayClassName}`.trim()}
              onClick={() => this.overlayClick()}
              style={this.getStyles('overlay')}
            />
          )}
          {this.props.customBurgerIcon !== false && (
            <div style={this.getStyles('burgerIcon')}>
              <BurgerIcon
                onClick={() => this.open()}
                styles={this.props.styles}
                customIcon={this.props.customBurgerIcon}
                className={this.props.burgerButtonClassName}
                barClassName={this.props.burgerBarClassName}
                onIconStateChange={this.props.onIconStateChange}
              />
            </div>
          )}
          <div
            id={this.props.id}
            className={`bm-menu-wrap ${this.props.className}`.trim()}
            style={this.getStyles('menuWrap')}
            aria-hidden={!this.state.isOpen}
          >
            {styles.svg && (
              <div
                className={`bm-morph-shape ${this.props.morphShapeClassName}`.trim()}
                style={this.getStyles('morphShape')}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 800"
                  preserveAspectRatio="none"
                >
                  <path d={styles.svg.pathInitial} />
                </svg>
              </div>
            )}
            <div
              className={`bm-menu ${this.props.menuClassName}`.trim()}
              style={this.getStyles('menu')}
            >
              {React.createElement(
                this.props.itemListElement,
                {
                  className: `bm-item-list ${this.props.itemListClassName}`.trim(),
                  style: this.getStyles('itemList')
                },
                React.Children.map(this.props.children, (item, index) => {
                  if (item) {
                    const classList = [
                      'bm-item',
                      this.props.itemClassName,
                      item.props.className
                    ]
                      .filter(className => !!className)
                      .join(' ');
                    const extraProps = {
                      key: index,
                      className: classList,
                      style: this.getStyles('item', index, item.props.style),
                      tabIndex: -1
                    };
                    return React.cloneElement(item, extraProps);
                  }
                })
              )}
            </div>
            {this.props.customCrossIcon !== false && (
              <div style={this.getStyles('closeButton')}>
                <CrossIcon
                  onClick={() => this.close()}
                  styles={this.props.styles}
                  customIcon={this.props.customCrossIcon}
                  className={this.props.crossButtonClassName}
                  crossClassName={this.props.crossClassName}
                />
              </div>
            )}
          </div>
        </React.Fragment>
      );
    }
  }

  Menu.propTypes = {
    bodyClassName: PropTypes.string,
    burgerBarClassName: PropTypes.string,
    burgerButtonClassName: PropTypes.string,
    className: PropTypes.string,
    crossButtonClassName: PropTypes.string,
    crossClassName: PropTypes.string,
    customBurgerIcon: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.oneOf([false])
    ]),
    customCrossIcon: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.oneOf([false])
    ]),
    customOnKeyDown: PropTypes.func,
    disableAutoFocus: PropTypes.bool,
    disableCloseOnEsc: PropTypes.bool,
    disableOverlayClick: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    htmlClassName: PropTypes.string,
    id: PropTypes.string,
    isOpen: PropTypes.bool,
    itemClassName: PropTypes.string,
    itemListClassName: PropTypes.string,
    itemListElement: PropTypes.oneOf(['div', 'nav']),
    menuClassName: PropTypes.string,
    morphShapeClassName: PropTypes.string,
    noOverlay: PropTypes.bool,
    noTransition: PropTypes.bool,
    onClose: PropTypes.func,
    onIconHoverChange: PropTypes.func,
    onOpen: PropTypes.func,
    onStateChange: PropTypes.func,
    outerContainerId:
      styles && styles.outerContainer
        ? PropTypes.string.isRequired
        : PropTypes.string,
    overlayClassName: PropTypes.string,
    pageWrapId:
      styles && styles.pageWrap
        ? PropTypes.string.isRequired
        : PropTypes.string,
    right: PropTypes.bool,
    styles: PropTypes.object,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  Menu.defaultProps = {
    bodyClassName: '',
    burgerBarClassName: '',
    burgerButtonClassName: '',
    className: '',
    crossButtonClassName: '',
    crossClassName: '',
    disableAutoFocus: false,
    disableCloseOnEsc: false,
    htmlClassName: '',
    id: '',
    itemClassName: '',
    itemListClassName: '',
    menuClassName: '',
    morphShapeClassName: '',
    noOverlay: false,
    noTransition: false,
    onStateChange: () => {},
    outerContainerId: '',
    overlayClassName: '',
    pageWrapId: '',
    styles: {},
    width: 300,
    onIconHoverChange: () => {},
    itemListElement: 'nav'
  };

  return Menu;
};
