/* eslint-disable prettier/prettier */
import { Module, Global } from '@nestjs/common';
import { DbService } from './db.service';

@Global() // hace disponible el DB en toda la app sin importar módulos
@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}