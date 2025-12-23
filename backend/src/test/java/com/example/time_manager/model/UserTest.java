package com.example.time_manager.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class UserTest {

    @Test
    void getAzureOid_shouldReturnNull_whenNotSet() {
        User user = new User();

        assertThat(user.getAzureOid()).isNull();
    }

    @Test
    void setAzureOid_shouldSetValue() {
        User user = new User();

        user.setAzureOid("azure-oid-123");

        assertThat(user.getAzureOid()).isEqualTo("azure-oid-123");
    }

    @Test
    void setAzureOid_shouldAllowNull() {
        User user = new User();
        user.setAzureOid("azure-oid-123");

        user.setAzureOid(null);

        assertThat(user.getAzureOid()).isNull();
    }

    @Test
    void setAzureOid_shouldOverwriteExistingValue() {
        User user = new User();
        user.setAzureOid("old-oid");

        user.setAzureOid("new-oid");

        assertThat(user.getAzureOid()).isEqualTo("new-oid");
    }
}
