import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TimelineEventResponse, TimelineEventType } from '../models/timeline.model';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getTimeline(operationId: number, type?: TimelineEventType): Observable<TimelineEventResponse[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<TimelineEventResponse[]>(`${this.apiUrl}/api/operations/${operationId}/timeline`, { params });
  }
}
