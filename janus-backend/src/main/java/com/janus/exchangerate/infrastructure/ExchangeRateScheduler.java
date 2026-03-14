package com.janus.exchangerate.infrastructure;

import com.janus.exchangerate.application.ExchangeRateService;
import io.quarkus.scheduler.Scheduled;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.LocalTime;

@ApplicationScoped
public class ExchangeRateScheduler {

    private static final Logger LOG = Logger.getLogger(ExchangeRateScheduler.class);

    @Inject
    ExchangeRateService exchangeRateService;

    @ConfigProperty(name = "janus.exchange-rate.auto-fetch.enabled", defaultValue = "false")
    boolean autoFetchEnabled;

    @ConfigProperty(name = "janus.exchange-rate.auto-fetch.hour", defaultValue = "8")
    int configHour;

    @ConfigProperty(name = "janus.exchange-rate.auto-fetch.minute", defaultValue = "0")
    int configMinute;

    private volatile boolean runtimeEnabled;
    private volatile int scheduledHour;
    private volatile int scheduledMinute;
    private volatile LocalDate lastFetchDate;

    @PostConstruct
    void init() {
        runtimeEnabled = autoFetchEnabled;
        scheduledHour = configHour;
        scheduledMinute = configMinute;
    }

    @Scheduled(every = "60s", identity = "exchange-rate-auto-fetch")
    void scheduledFetch() {
        if (!runtimeEnabled) return;

        var now = LocalTime.now();
        if (now.getHour() == scheduledHour && now.getMinute() == scheduledMinute) {
            var today = LocalDate.now();
            if (today.equals(lastFetchDate)) return;

            try {
                exchangeRateService.fetchExternalRate("system");
                lastFetchDate = today;
                LOG.infof("Scheduled exchange rate fetch completed at %02d:%02d", scheduledHour, scheduledMinute);
            } catch (Exception e) {
                LOG.error("Scheduled exchange rate fetch failed", e);
            }
        }
    }

    public boolean isEnabled() {
        return runtimeEnabled;
    }

    public void setEnabled(boolean enabled) {
        this.runtimeEnabled = enabled;
    }

    public int getScheduledHour() {
        return scheduledHour;
    }

    public int getScheduledMinute() {
        return scheduledMinute;
    }

    public void setScheduledTime(int hour, int minute) {
        this.scheduledHour = hour;
        this.scheduledMinute = minute;
        this.lastFetchDate = null; // reset so it can run again today if time changes
    }
}
