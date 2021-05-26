/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface ModusButton {
        /**
          * (optional) Disables the button
         */
        "disabled": boolean;
        /**
          * (optional) The size of the button
         */
        "size": 'small' | 'medium' | 'large';
        /**
          * (optional) The type of button
         */
        "type": 'cta' | 'default' | 'primary' | 'secondary' | 'warning';
    }
}
declare global {
    interface HTMLModusButtonElement extends Components.ModusButton, HTMLStencilElement {
    }
    var HTMLModusButtonElement: {
        prototype: HTMLModusButtonElement;
        new (): HTMLModusButtonElement;
    };
    interface HTMLElementTagNameMap {
        "modus-button": HTMLModusButtonElement;
    }
}
declare namespace LocalJSX {
    interface ModusButton {
        /**
          * (optional) Disables the button
         */
        "disabled"?: boolean;
        /**
          * (optional) An event that fires on button click
         */
        "onButtonClick"?: (event: CustomEvent<any>) => void;
        /**
          * (optional) The size of the button
         */
        "size"?: 'small' | 'medium' | 'large';
        /**
          * (optional) The type of button
         */
        "type"?: 'cta' | 'default' | 'primary' | 'secondary' | 'warning';
    }
    interface IntrinsicElements {
        "modus-button": ModusButton;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "modus-button": LocalJSX.ModusButton & JSXBase.HTMLAttributes<HTMLModusButtonElement>;
        }
    }
}
