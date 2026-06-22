import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

class SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsIn(['text', 'image'])
  type?: 'text' | 'image';
}

@ApiTags('chat')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  list(@CurrentUser('userId') userId: string) {
    return this.chatService.listConversations(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre total de messages non lus' })
  unreadCount(@CurrentUser('userId') userId: string) {
    return this.chatService.getUnreadTotal(userId);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Query('after') after?: string,
  ) {
    return this.chatService.getMessages(userId, id, after);
  }

  @Post(':id/messages')
  send(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, id, {
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      type: dto.type,
    });
  }

  @Post(':id/read')
  markRead(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.chatService.markRead(userId, id);
  }
}