import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ChatService, MESSAGE_REPORT_REASONS } from './chat.service';
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

class ReportMessageDto {
  @IsIn([...MESSAGE_REPORT_REASONS])
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}

@ApiTags('chat')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  list(
    @CurrentUser('userId') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.chatService.listConversations(userId, unreadOnly === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre total de messages non lus' })
  unreadCount(@CurrentUser('userId') userId: string) {
    return this.chatService.getUnreadTotal(userId);
  }

  @Get('search/messages')
  @ApiOperation({ summary: 'Rechercher dans mes messages' })
  searchMessages(
    @CurrentUser('userId') userId: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.searchMessages(userId, q, limit ? parseInt(limit, 10) : 30);
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

  @Post(':id/messages/:messageId/report')
  @ApiOperation({ summary: 'Signaler un message' })
  report(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() dto: ReportMessageDto,
  ) {
    return this.chatService.reportMessage(userId, id, messageId, dto.reason, dto.details);
  }

  @Post(':id/read')
  markRead(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.chatService.markRead(userId, id);
  }
}