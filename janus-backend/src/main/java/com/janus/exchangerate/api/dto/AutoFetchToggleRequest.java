package com.janus.exchangerate.api.dto;

public record AutoFetchToggleRequest(boolean enabled, Integer hour, Integer minute) {
}
