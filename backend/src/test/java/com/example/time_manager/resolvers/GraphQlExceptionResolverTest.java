package com.example.time_manager.resolvers;

import com.example.time_manager.graphql.GraphQlExceptionResolver;
import graphql.GraphQLError;
import graphql.execution.ExecutionStepInfo;
import graphql.language.Field;
import graphql.language.SourceLocation;
import graphql.schema.DataFetchingEnvironment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GraphQlExceptionResolverTest {

    private GraphQlExceptionResolver resolver;
    private DataFetchingEnvironment env;

    @BeforeEach
    void setUp() {
        resolver = new GraphQlExceptionResolver();

        env = mock(DataFetchingEnvironment.class);
        Field mockField = mock(Field.class);
        when(mockField.getSourceLocation()).thenReturn(new SourceLocation(1, 1));
        when(mockField.getName()).thenReturn("testField");

        ExecutionStepInfo execInfo = mock(ExecutionStepInfo.class);
        when(execInfo.getPath()).thenReturn(null);

        when(env.getField()).thenReturn(mockField);
        when(env.getExecutionStepInfo()).thenReturn(execInfo);
        when(env.getGraphQlContext()).thenReturn(null);
    }

    @Test
    void testAccessDeniedException_ReturnsForbiddenError() {
        GraphQLError error = resolver.resolveToSingleError(new AccessDeniedException("Denied"), env);
        assertEquals(ErrorType.FORBIDDEN, error.getErrorType());
        assertEquals("FORBIDDEN", error.getMessage());
    }

    @Test
    void testEntityNotFoundException_ReturnsNotFoundError() {
        GraphQLError error = resolver.resolveToSingleError(new EntityNotFoundException("User not found"), env);
        assertEquals(ErrorType.NOT_FOUND, error.getErrorType());
        assertEquals("User not found", error.getMessage());
    }

    @Test
    void testIllegalArgumentException_ReturnsBadRequestError() {
        GraphQLError error = resolver.resolveToSingleError(new IllegalArgumentException("Bad input"), env);
        assertEquals(ErrorType.BAD_REQUEST, error.getErrorType());
        assertEquals("Bad input", error.getMessage());
    }

    @Test
    void testConstraintViolationException_ReturnsBadRequestError() {
        GraphQLError error = resolver.resolveToSingleError(
                new ConstraintViolationException("Validation failed", null), env);
        assertEquals(ErrorType.BAD_REQUEST, error.getErrorType());
        assertEquals("Validation failed", error.getMessage());
    }

    @Test
    void testDataIntegrityViolationException_ReturnsBadRequestError() {
        GraphQLError error = resolver.resolveToSingleError(
                new DataIntegrityViolationException("Duplicate entry"), env);
        assertEquals(ErrorType.BAD_REQUEST, error.getErrorType());
        assertEquals("Data integrity violation", error.getMessage());
    }

    @Test
    void testUnknownException_ReturnsInternalError() {
        GraphQLError error = resolver.resolveToSingleError(new RuntimeException("Unexpected failure"), env);
        assertEquals(ErrorType.INTERNAL_ERROR, error.getErrorType());
        assertEquals("Unexpected error", error.getMessage());
    }

    @Test
    void testIllegalArgumentException_NullMessage_UsesDefaultMessage() {
        GraphQLError error = resolver.resolveToSingleError(new IllegalArgumentException((String) null), env);
        assertEquals(ErrorType.BAD_REQUEST, error.getErrorType());
        assertEquals("Invalid input", error.getMessage());
    }
}
