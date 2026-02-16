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
        </div>
      </div>
    }
    @if (comments().length > 0) {
      @for (comment of comments(); track comment.id) {
        <div class="card mb-2">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between">
              <strong>{{ comment.authorFullName }}</strong>
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

  ngOnInit(): void { this.loadComments(); }

  loadComments(): void {
    this.commentService.getComments(this.operationId()).subscribe(c => this.comments.set(c));
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    this.commentService.addComment(this.operationId(), { content: this.newComment }).subscribe(() => {
      this.newComment = '';
      this.loadComments();
    });
  }
}
