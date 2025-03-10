// eslint-disable-next-line
import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'modus-tooltip',
  styleUrl: 'modus-tooltip.scss',
  shadow: true,
})
export class ModusTooltip {
  /** (optional) The tooltip's aria-label. */
  @Prop() ariaLabel: string | null;

  /** (optional) The tooltip's position relative to its content. */
  @Prop() position: 'bottom' | 'left' | 'right' | 'top' = 'top';

  /** The tooltip's text. */
  @Prop() text: string;

  render(): unknown {
    const className = `modus-tooltip ${this.position}`;
    return (
      <div class={className}>
        <slot />
        {this.text && (
          <div aria-label={this.ariaLabel} class={'text'} role="tooltip">
            {this.text}
          </div>
        )}
      </div>
    );
  }
}
