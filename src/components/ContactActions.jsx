import { useCallback, useState } from 'react';
import Modal from './Modal.jsx';
import { useLang } from '../lib/i18n.jsx';

// Version 1: neither chat nor in-app calling is implemented. Both buttons
// open an informational modal only. No message is sent and no call is
// started.
export default function ContactActions({ compact = false }) {
  const { t } = useLang();
  const [modal, setModal] = useState(null);
  const close = useCallback(() => setModal(null), []);

  return (
    <>
      <div className={`contact-actions${compact ? ' compact' : ''}`}>
        <button type="button" className="btn btn-outline" onClick={() => setModal('chat')}>
          <span aria-hidden="true">💬</span> {t('action.chat')}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setModal('call')}>
          <span aria-hidden="true">📞</span> {t('action.call')}
        </button>
      </div>

      {modal ? (
        <Modal title={t(`modal.${modal}.title`)} onClose={close} closeLabel={t('action.close')}>
          <p className="modal-alt">{t(`modal.${modal}.alt`)}</p>
          <p>{t(`modal.${modal}.body`)}</p>
        </Modal>
      ) : null}
    </>
  );
}
