import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommentService } from '../../../core/services/comment.service';
import { Comment } from '../../../core/models/comment.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-operation-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    @if (authService.hasRole(['ADMIN', 'AGENT'])) {
      <div class="card mb-3">
        <div class="card-body">
          <div class="input-group">
            <input type="text" class="form-control" [placeholder]="'COMMENTS.PLACEHOLDER' | translate" [(ngModel)]="newComment">
            <button class="btn btn-primary" (click)="addComment()" [disabled]="!newComment.trim()">{{ 'COMMENTS.SUBMIT' | translate }}</button>
          </div>
          @if (canToggleInternal()) {
            <div class="form-check mt-2">
              <input class="form-check-input" type="checkbox" id="internalToggle" [(ngModel)]="internalFlag">
              <label class="form-check-label" for="internalToggle">{{ 'COMMENTS.INTERNAL_TOGGLE' | translate }}</label>
            </div>
          }
        </div>
      </div>
    }
    @if (comments().length > 0) {
      @for (comment of comments(); track comment.id) {
        <div class="card mb-2" [class.border-start]="comment.internal" [class.border-warning]="comment.internal" [class.border-3]="comment.internal" [class.bg-light]="comment.internal">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between">
              <div>
                <strong>{{ comment.authorFullName }}</strong>
                @if (comment.internal) {
                  <span class="badge bg-warning text-dark ms-2">{{ 'COMMENTS.INTERNAL' | translate }}</span>
                }
              </div>
              <small class="text-muted">{{ comment.createdAt | date:'medium' }}</small>
            </div>
            <p class="mb-0 mt-1">{{ comment.content }}</p>
          </div>
        </div>
      }
    } @else {
      <p class="text-muted">{{ 'COMMENTS.NO_COMMENTS' | translate }}</p>
    }
  `
})
export class OperationCommentsComponent implements OnInit {
  operationId = input.required<number>();

  private commentService = inject(CommentService);
  authService = inject(AuthService);
  comments = signal<Comment[]>([]);
  newComment = '';
  internalFlag = false;

  ngOnInit(): void { this.loadComments(); }

  canToggleInternal(): boolean {
    return this.authService.hasRole(['ADMIN', 'AGENT', 'ACCOUNTING']);
  }

  loadComments(): void {
    this.commentService.getComments(this.operationId()).subscribe(c => this.comments.set(c));
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    this.commentService.addComment(this.operationId(), {
      content: this.newComment,
      internal: this.internalFlag
    }).subscribe(() => {
      this.newComment = '';
      this.internalFlag = false;
      this.loadComments();
    });
  }
}
