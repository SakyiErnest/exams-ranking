declare module '@hookform/resolvers/zod' {
    import { Resolver, FieldValues } from 'react-hook-form';
    import { ZodSchema } from 'zod';
    
    export function zodResolver<T extends FieldValues>(schema: ZodSchema<unknown>): Resolver<T>;
}
