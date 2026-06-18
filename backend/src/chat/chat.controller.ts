import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { IsString } from 'class-validator';

class SendMessageDto {
  @IsString()
  content: string;
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

  @Get(':id/messages')
  messages(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.chatService.getMessages(userId, id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, id, dto.content);
  }

  @Post(':id/read')
  markRead(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.chatService.markRead(userId, id);
  }
}