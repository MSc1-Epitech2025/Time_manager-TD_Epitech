package com.example.time_manager.services.leaves;

import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.repository.leave.LeaveTypeRepository;
import com.example.time_manager.service.leave.LeaveTypeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveTypeServiceTest {

    private LeaveTypeRepository repo;
    private LeaveTypeService service;

    @BeforeEach
    void setUp() {
        repo = mock(LeaveTypeRepository.class);
        service = new LeaveTypeService(repo);
    }

    @Test
    void testListAll() {
        List<LeaveType> types = List.of(new LeaveType("VAC", "Vacances"));
        when(repo.findAll()).thenReturn(types);

        List<LeaveType> result = service.listAll();

        assertEquals(1, result.size());
        assertEquals("VAC", result.get(0).getCode());
        verify(repo).findAll();
    }

    @Test
    void testGetByCode_Success() {
        LeaveType lt = new LeaveType("VAC", "Vacances");
        when(repo.findById("VAC")).thenReturn(Optional.of(lt));

        LeaveType result = service.getByCode("VAC");

        assertEquals("VAC", result.getCode());
        verify(repo).findById("VAC");
    }

    @Test
    void testGetByCode_NotFound_Throws() {
        when(repo.findById("RTT")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.getByCode("RTT"));
    }

    @Test
    void testCreate_Success() {
        when(repo.existsById("VAC")).thenReturn(false);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveType result = service.create("VAC", "Vacances");

        assertEquals("VAC", result.getCode());
        assertEquals("Vacances", result.getLabel());
        verify(repo).save(any(LeaveType.class));
    }

    @Test
    void testCreate_AlreadyExists_Throws() {
        when(repo.existsById("VAC")).thenReturn(true);
        assertThrows(IllegalStateException.class, () -> service.create("VAC", "Vacances"));
        verify(repo, never()).save(any());
    }

    @Test
    void testUpdate_Success_WithNewLabel() {
        LeaveType lt = new LeaveType("VAC", "Old Label");
        when(repo.findById("VAC")).thenReturn(Optional.of(lt));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveType result = service.update("VAC", "Nouveau Label");

        assertEquals("Nouveau Label", result.getLabel());
        verify(repo).save(lt);
    }

    @Test
    void testUpdate_Success_LabelNull_Ignored() {
        LeaveType lt = new LeaveType("VAC", "Old Label");
        when(repo.findById("VAC")).thenReturn(Optional.of(lt));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveType result = service.update("VAC", null);

        assertEquals("Old Label", result.getLabel());
        verify(repo).save(lt);
    }

    @Test
    void testUpdate_NotFound_Throws() {
        when(repo.findById("RTT")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.update("RTT", "Label"));
    }

    @Test
    void testDelete_Success() {
        when(repo.existsById("VAC")).thenReturn(true);

        boolean result = service.delete("VAC");

        assertTrue(result);
        verify(repo).deleteById("VAC");
    }

    @Test
    void testDelete_NotExists() {
        when(repo.existsById("VAC")).thenReturn(false);

        boolean result = service.delete("VAC");

        assertFalse(result);
        verify(repo, never()).deleteById(any());
    }
}
