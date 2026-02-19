import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { OperationCommentsComponent } from './operation-comments.component';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';

describe('OperationCommentsComponent', () => {
  let component: OperationCommentsComponent;
  let fixture: ComponentFixture<OperationCommentsComponent>;
  let commentServiceSpy: jasmine.SpyObj<CommentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockComment = {
    id: 1, operationId: 1, authorUsername: 'admin', authorFullName: 'Admin User',
    content: 'Test comment', internal: false, createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    commentServiceSpy = jasmine.createSpyObj('CommentService', ['getComments', 'addComment']);
    commentServiceSpy.getComments.and.returnValue(of([mockComment]));
    commentServiceSpy.addComment.and.returnValue(of(mockComment));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole'], {
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      user: jasmine.createSpy().and.returnValue({ username: 'admin', role: 'ADMIN' })
    });
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [OperationCommentsComponent, TranslateModule.forRoot(), FormsModule],
      providers: [
        { provide: CommentService, useValue: commentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationCommentsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('operationId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comments on init', () => {
    expect(commentServiceSpy.getComments).toHaveBeenCalledWith(1);
    expect(component.comments().length).toBe(1);
  });

  it('should add a comment', () => {
    component.newComment = 'New comment';
    component.addComment();
    expect(commentServiceSpy.addComment).toHaveBeenCalledWith(1, { content: 'New comment', internal: false });
  });

  it('should not add empty comment', () => {
    component.newComment = '   ';
    component.addComment();
    expect(commentServiceSpy.addComment).not.toHaveBeenCalled();
  });
});
