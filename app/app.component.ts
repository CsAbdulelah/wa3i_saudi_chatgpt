import { Component } from '@angular/core';

import { Subject, from, merge, Observable } from 'rxjs';
import { switchMap, map, windowCount, scan, take, tap } from 'rxjs/operators';

import {
  ChatModule,
  Message,
  User,
  Action,
  ExecuteActionEvent,
  SendMessageEvent,
} from '@progress/kendo-angular-conversational-ui';
import { ChatService } from './chat.service';

@Component({
  providers: [ChatService],
  selector: 'my-app',
  template: `
  <img src='logoChatGPT.png'>
<kendo-chat
[messages]="feed | async"
[user]="user"
(sendMessage)="sendMessage($event)">
</kendo-chat>
`,
})
export class AppComponent {
  public feed: Observable<Message[]>;

  public readonly user: User = {
    id: 1,
  };

  public readonly bot: User = {
    id: 0,
  };

  private local: Subject<Message> = new Subject<Message>();

  constructor(private svc: ChatService) {
    const hello: Message = {
      author: this.bot,
      suggestedActions: [],
      timestamp: new Date(),
      text: 'اهلا كيف اقدر اخدمك',
    };
    // Summrize below text: text
    // Merge local and remote messages into a single stream
    this.feed = merge(
      from([hello]),
      this.local,
      this.svc.responses.pipe(
        map(
          (response: string): Message => ({
            author: this.bot,
            text: response.choices[0].text,
          })
        )
      )
    ).pipe(
      // ... and emit an array of all messages
      scan((acc: Message[], x: Message) => [...acc, x], [])
    );
  }

  public sendMessage(e: SendMessageEvent): void {
    this.local.next(e.message);
    console.log(e.message);
    this.local.next({
      author: this.bot,
      typing: true,
    });

    this.svc.sendMessage(e.message.text);
    console.log(e.message.text);
  }
}
