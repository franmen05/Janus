import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment, CreateCommentRequest } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getComments(operationId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/api/operations/${operationId}/comments`);
  }

  addComment(operationId: number, request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/api/operations/${operationId}/comments`, request);
  }
}
