import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogContentSection,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="max-h-[85vh] flex flex-col bg-surface-secondary border-border-secondary shadow-2xl"
      >
        <DialogHeader
          title={t("setting.privacy-policy-title")}
          subtitle={t("setting.privacy-policy-last-updated")}
          className="bg-surface-secondary border-b border-border-secondary px-8 py-6"
        />

        <DialogContentSection className="flex-1 min-h-0 p-0 bg-surface-tertiary">
          <div className="h-[55vh] overflow-y-auto scroll-smooth">
            <div className="flex flex-col gap-8 px-8 py-8">
              {/* Overview Section */}
              <section className="space-y-3">
                <h3 className="text-body-md font-semibold text-text-heading tracking-tight">
                  {t("setting.privacy-policy-overview-title")}
                </h3>
                <p className="text-body-sm text-text-body leading-relaxed">
                  {t("setting.privacy-policy-overview")}
                </p>
              </section>

              {/* Divider */}
              <div className="h-px bg-border-secondary" />

              {/* Data Collection Section */}
              <section className="space-y-3">
                <h3 className="text-body-md font-semibold text-text-heading tracking-tight">
                  {t("setting.privacy-policy-data-collection-title")}
                </h3>
                <p className="text-body-sm text-text-body leading-relaxed">
                  {t("setting.privacy-policy-data-collection")}
                </p>
              </section>

              {/* Divider */}
              <div className="h-px bg-border-secondary" />

              {/* Data Storage Section */}
              <section className="space-y-3">
                <h3 className="text-body-md font-semibold text-text-heading tracking-tight">
                  {t("setting.privacy-policy-data-storage-title")}
                </h3>
                <p className="text-body-sm text-text-body leading-relaxed">
                  {t("setting.privacy-policy-data-storage")}
                </p>
              </section>

              {/* Divider */}
              <div className="h-px bg-border-secondary" />

              {/* Third-Party Sharing Section */}
              <section className="space-y-3">
                <h3 className="text-body-md font-semibold text-text-heading tracking-tight">
                  {t("setting.privacy-policy-third-party-title")}
                </h3>
                <p className="text-body-sm text-text-body leading-relaxed">
                  {t("setting.privacy-policy-third-party")}
                </p>
              </section>

              {/* Divider */}
              <div className="h-px bg-border-secondary" />

              {/* User Rights Section */}
              <section className="space-y-3">
                <h3 className="text-body-md font-semibold text-text-heading tracking-tight">
                  {t("setting.privacy-policy-user-rights-title")}
                </h3>
                <p className="text-body-sm text-text-body leading-relaxed">
                  {t("setting.privacy-policy-user-rights")}
                </p>
              </section>

              {/* Divider */}
              <div className="h-px bg-border-secondary" />

              {/* Contact Section */}
              <section className="space-y-3">
                <h3 className="text-body-md font-semibold text-text-heading tracking-tight">
                  {t("setting.privacy-policy-contact-title")}
                </h3>
                <p className="text-body-sm text-text-body leading-relaxed">
                  {t("setting.privacy-policy-contact")}
                </p>
              </section>
            </div>
          </div>
        </DialogContentSection>

        <DialogFooter className="justify-end bg-surface-secondary border-t border-border-secondary px-8 py-5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            {t("setting.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
