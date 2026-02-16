package com.janus.notification.infrastructure;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class EmailNotificationAdapter {

    private static final Logger LOG = Logger.getLogger(EmailNotificationAdapter.class);

    @Inject
    Mailer mailer;

    public void send(String to, String subject, String body) {
        LOG.infof("Sending email to %s: %s", to, subject);
        mailer.send(Mail.withText(to, subject, body));
    }
}
