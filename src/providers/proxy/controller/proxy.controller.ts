import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { ProxyService } from '../service/proxy.service.js';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@ApiTags('Proxy')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @ApiOperation({
    summary:
      "Proxy stream requests (e.g., .m3u8, .ts) (the id doesn't matter at all)",
  })
  @ApiQuery({ name: 'url', required: true, description: 'CDN resource URL' })
  async proxyStream(@Query('url') url: string, @Res() res: Response) {
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ message: 'Invalid URL' });
      return;
    }

    try {
      const { content, headers, isStream } =
        await this.proxyService.fetchProxiedStream(url);

      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });

      if (isStream && content instanceof Readable) {
        res.flushHeaders();
        const onClose = () => {
          content.destroy();
        };

        res.on('close', onClose);
        res.on('finish', () => res.removeListener('close', onClose));
        content.on('error', (err) => {
          console.error('Stream error:', err);
          if (!res.headersSent && !res.writableEnded) {
            res.status(500).send('Stream error');
          }
        });

        await pipeline(content, res);
      } else {
        res.send(content);
      }
    } catch (err: unknown) {
      console.error('Proxy failed:', err instanceof Error ? err.message : err);
      if (!res.headersSent && !res.writableEnded) {
        res.status(500).json({
          message: 'Failed to fetch resource',
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
