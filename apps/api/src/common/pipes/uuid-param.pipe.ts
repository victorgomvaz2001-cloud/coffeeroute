import { NotFoundException, ParseUUIDPipe } from '@nestjs/common';

/** A malformed id can never match a resource, so treat it as "not found" rather than a 400. */
export const UuidParam = (resource = 'El recurso') =>
  new ParseUUIDPipe({
    exceptionFactory: () =>
      new NotFoundException({ message: `${resource} no existe.`, code: 'NOT_FOUND' }),
  });
