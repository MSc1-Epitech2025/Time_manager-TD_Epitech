package com.example.time_manager.graphql;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

  @Override
  protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {

    if (ex instanceof AccessDeniedException) {
      return GraphqlErrorBuilder.newError(env)
          .errorType(ErrorType.FORBIDDEN)
          .message("FORBIDDEN")
          .build();
    }

    if (ex instanceof EntityNotFoundException) {
      return GraphqlErrorBuilder.newError(env)
          .errorType(ErrorType.NOT_FOUND)
          .message(ex.getMessage())
          .build();
    }

    if (ex instanceof IllegalArgumentException || ex instanceof ConstraintViolationException) {
      return GraphqlErrorBuilder.newError(env)
          .errorType(ErrorType.BAD_REQUEST)
          .message(ex.getMessage() != null ? ex.getMessage() : "Invalid input")
          .build();
    }

    if (ex instanceof DataIntegrityViolationException) {
      return GraphqlErrorBuilder.newError(env)
          .errorType(ErrorType.BAD_REQUEST)
          .message("Data integrity violation")
          .build();
    }

    // Fallback: leaves Spring logger, but returns a generic message
    return GraphqlErrorBuilder.newError(env)
        .errorType(ErrorType.INTERNAL_ERROR)
        .message("Unexpected error")
        .build();
  }
}
