import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="typing-bubble" *ngIf="show">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="typing-text" *ngIf="text">{{ text }}</span>
    </div>
  `,
  styles: [`
    .typing-bubble {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 10px 12px;
      background: white;
      border-radius: 7.5px;
      box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #90949c;
      animation: typing-bounce 1.4s infinite ease-in-out;
    }

    .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing-bounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    .typing-text {
      font-size: 12px;
      color: #90949c;
      margin-left: 4px;
    }

    :host-context(.dark) .typing-bubble {
      background: #005c4b;
    }

    :host-context(.dark) .dot {
      background: #8696a0;
    }
  `]
})
export class TypingIndicatorComponent {
  @Input() show: boolean = false;
  @Input() text: string = 'typing...';
}
