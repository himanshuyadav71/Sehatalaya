import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PHOTO_BUCKET, photoUrl, supabase } from '../../lib/supabase.js';
import { emptyToNull, isHttpUrl, todayIso } from '../../lib/utils.js';

const EMPTY = {
  type: 'doctor',
  status: 'draft',
  name: '',
  name_hi: '',
  specialty_id: '',
  qualifications: '',
  experience_years: '',
  registration_number: '',
  registration_council: '',
  registration_verified: false,
  clinic_name: '',
  address: '',
  area: '',
  city: 'Dewas',
  state: 'Madhya Pradesh',
  pincode: '',
  phone: '',
  phone_verified: false,
  maps_url: '',
  website_url: '',
  timings: '',
  photo_path: null,
  photo_authorized: false,
  source_url: '',
  source_checked_on: '',
  source_notes: '',
  verification_notes: '',
  verified: false,
};

const TEXT_FIELDS = [
  'name_hi',
  'qualifications',
  'registration_number',
  'registration_council',
  'clinic_name',
  'address',
  'area',
  'pincode',
  'phone',
  'maps_url',
  'website_url',
  'timings',
  'source_url',
  'source_notes',
  'verification_notes',
];

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function fromRow(row) {
  const form = { ...EMPTY };
  Object.keys(EMPTY).forEach((k) => {
    const v = row[k];
    if (typeof EMPTY[k] === 'boolean') form[k] = Boolean(v);
    else if (k === 'photo_path') form[k] = v || null;
    else form[k] = v === null || v === undefined ? '' : String(v);
  });
  return form;
}

export default function ProviderForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoConfirm, setPhotoConfirm] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    supabase
      .from('specialties')
      .select('id, name_en, active')
      .order('sort_order')
      .order('name_en')
      .then(({ data }) => setSpecialties(data || []));
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) setErrors(['This listing could not be loaded.']);
        else setForm(fromRow(data));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isNew]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Keep dependent flags consistent with the database constraints.
      if (key === 'registration_number' && !String(value).trim()) {
        next.registration_verified = false;
      }
      if (next.type === 'doctor' && !next.registration_verified) next.verified = false;
      if (key === 'phone' && !String(value).trim()) next.phone_verified = false;
      return next;
    });
  };

  const isDoctor = form.type === 'doctor';
  const canVerifyRegistration = Boolean(form.registration_number.trim());
  const canMarkVerified = !isDoctor || form.registration_verified;

  const validate = () => {
    const out = [];
    if (!form.name.trim()) out.push('Name is required.');
    if (form.experience_years !== '') {
      const n = Number(form.experience_years);
      if (!Number.isInteger(n) || n < 0 || n > 80) {
        out.push('Experience must be a whole number of years between 0 and 80.');
      }
    }
    ['maps_url', 'website_url', 'source_url'].forEach((k) => {
      if (form[k].trim() && !isHttpUrl(form[k].trim())) {
        out.push(`${k.replace('_', ' ')} must start with http:// or https://`);
      }
    });
    if (photoFile) {
      if (!PHOTO_TYPES.includes(photoFile.type)) out.push('Photo must be a JPG, PNG or WebP image.');
      if (photoFile.size > MAX_PHOTO_BYTES) out.push('Photo must be smaller than 2 MB.');
      if (!photoConfirm) {
        out.push('Confirm that you are authorised to publish this photo before uploading it.');
      }
    }
    if (form.status === 'published' && !form.source_url.trim() && !form.source_notes.trim()) {
      out.push(
        'Before publishing, record where this information came from (source URL, or a note such as "confirmed directly with the clinic").',
      );
    }
    return out;
  };

  const save = async (e) => {
    e.preventDefault();
    const problems = validate();
    setErrors(problems);
    if (problems.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);

    const rowId = id || crypto.randomUUID();
    const payload = {
      id: rowId,
      type: form.type,
      status: form.status,
      name: form.name.trim(),
      city: form.city.trim() || 'Dewas',
      state: form.state.trim() || 'Madhya Pradesh',
      specialty_id: isDoctor && form.specialty_id ? Number(form.specialty_id) : null,
      experience_years:
        isDoctor && form.experience_years !== '' ? Number(form.experience_years) : null,
      source_checked_on: form.source_checked_on || null,
      registration_verified: isDoctor && canVerifyRegistration && form.registration_verified,
      phone_verified: Boolean(form.phone.trim()) && form.phone_verified,
      verified: canMarkVerified && form.verified,
      photo_path: form.photo_path,
      photo_authorized: form.photo_authorized,
    };
    TEXT_FIELDS.forEach((k) => {
      payload[k] = emptyToNull(form[k]);
    });
    if (!isDoctor) {
      payload.qualifications = null;
      payload.registration_number = null;
      payload.registration_council = null;
    }

    const oldPhoto = form.photo_path;
    let uploadedPath = null;

    if (photoFile) {
      const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
      uploadedPath = `${rowId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(uploadedPath, photoFile, { contentType: photoFile.type, upsert: false });
      if (upErr) {
        setErrors([`Photo upload failed: ${upErr.message}`]);
        setSaving(false);
        return;
      }
      payload.photo_path = uploadedPath;
      payload.photo_authorized = true;
    } else if (removePhoto) {
      payload.photo_path = null;
      payload.photo_authorized = false;
    }

    const { error } = await supabase.from('providers').upsert(payload, { onConflict: 'id' });
    if (error) {
      if (uploadedPath) await supabase.storage.from(PHOTO_BUCKET).remove([uploadedPath]);
      setErrors([`Save failed: ${error.message}`]);
      setSaving(false);
      return;
    }
    if (oldPhoto && (uploadedPath || removePhoto)) {
      await supabase.storage.from(PHOTO_BUCKET).remove([oldPhoto]);
    }
    navigate('/admin');
  };

  if (loading) return <p className="status">Loading…</p>;

  const currentPhoto = !removePhoto && form.photo_path ? photoUrl(form.photo_path) : null;

  return (
    <form className="admin-form" onSubmit={save} noValidate>
      <div className="admin-title-row">
        <h1 className="page-title">{isNew ? 'Add provider' : `Edit: ${form.name || 'provider'}`}</h1>
        <Link to="/admin" className="btn btn-ghost">
          Cancel
        </Link>
      </div>

      {errors.length ? (
        <div className="notice notice-error" role="alert">
          <ul>
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="muted small">
        Leave a field empty when the information is not available — the site shows it as “N/A”.
        Never guess or fill in unconfirmed details.
      </p>

      <fieldset className="card">
        <legend>Basics</legend>
        <div className="form-grid">
          <label className="field">
            <span>Type *</span>
            <select value={form.type} onChange={set('type')}>
              <option value="doctor">Doctor / clinic</option>
              <option value="lab">Diagnostic lab</option>
              <option value="pharmacy">Pharmacy / medical store</option>
            </select>
          </label>
          <label className="field">
            <span>Publication status</span>
            <select value={form.status} onChange={set('status')}>
              <option value="draft">Draft (not public)</option>
              <option value="published">Published (public)</option>
              <option value="archived">Archived (not public)</option>
            </select>
          </label>
          <label className="field">
            <span>{isDoctor ? 'Doctor name (English) *' : 'Business name (English) *'}</span>
            <input value={form.name} onChange={set('name')} required maxLength={200} />
          </label>
          <label className="field">
            <span>Name (Hindi)</span>
            <input value={form.name_hi} onChange={set('name_hi')} maxLength={200} lang="hi" />
          </label>
        </div>
      </fieldset>

      {isDoctor ? (
        <fieldset className="card">
          <legend>Doctor details</legend>
          <div className="form-grid">
            <label className="field">
              <span>Specialty</span>
              <select value={form.specialty_id} onChange={set('specialty_id')}>
                <option value="">Not available</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_en}
                    {s.active ? '' : ' (inactive)'}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Qualifications</span>
              <input
                value={form.qualifications}
                onChange={set('qualifications')}
                placeholder="e.g. MBBS, MD (Medicine)"
                maxLength={200}
              />
            </label>
            <label className="field">
              <span>Experience (years)</span>
              <input
                type="number"
                min="0"
                max="80"
                step="1"
                value={form.experience_years}
                onChange={set('experience_years')}
              />
            </label>
            <label className="field">
              <span>Clinic / hospital</span>
              <input value={form.clinic_name} onChange={set('clinic_name')} maxLength={200} />
            </label>
            <label className="field">
              <span>Registration number</span>
              <input
                value={form.registration_number}
                onChange={set('registration_number')}
                maxLength={60}
              />
            </label>
            <label className="field">
              <span>Registration council</span>
              <input
                value={form.registration_council}
                onChange={set('registration_council')}
                placeholder="e.g. Madhya Pradesh Medical Council"
                maxLength={120}
              />
            </label>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.registration_verified}
              disabled={!canVerifyRegistration}
              onChange={set('registration_verified')}
            />
            <span>
              I have checked this registration number against the council’s official register
              {!canVerifyRegistration ? ' (enter a registration number first)' : ''}
            </span>
          </label>
          <p className="muted small">
            Check the name and number on the{' '}
            <a
              href="https://www.nmc.org.in/information-desk/indian-medical-register/"
              target="_blank"
              rel="noopener noreferrer"
            >
              NMC Indian Medical Register
            </a>{' '}
            or the relevant state / dental / AYUSH council before ticking this box, and note what you
            checked under “Verification notes”.
          </p>
        </fieldset>
      ) : null}

      <fieldset className="card">
        <legend>Location and contact</legend>
        <div className="form-grid">
          <label className="field span-2">
            <span>Address</span>
            <input value={form.address} onChange={set('address')} maxLength={300} />
          </label>
          <label className="field">
            <span>Area / locality</span>
            <input
              value={form.area}
              onChange={set('area')}
              placeholder="Used for the area filter"
              maxLength={80}
            />
          </label>
          <label className="field">
            <span>PIN code</span>
            <input value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} />
          </label>
          <label className="field">
            <span>City</span>
            <input value={form.city} onChange={set('city')} maxLength={80} />
          </label>
          <label className="field">
            <span>State</span>
            <input value={form.state} onChange={set('state')} maxLength={80} />
          </label>
          <label className="field">
            <span>Public contact number</span>
            <input value={form.phone} onChange={set('phone')} inputMode="tel" maxLength={30} />
          </label>
          <label className="field">
            <span>Timings</span>
            <input value={form.timings} onChange={set('timings')} maxLength={200} />
          </label>
          <label className="field">
            <span>Google Maps listing link</span>
            <input
              type="url"
              value={form.maps_url}
              onChange={set('maps_url')}
              placeholder="https://maps.app.goo.gl/…"
            />
          </label>
          <label className="field">
            <span>Website</span>
            <input type="url" value={form.website_url} onChange={set('website_url')} />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={form.phone_verified}
            disabled={!form.phone.trim()}
            onChange={set('phone_verified')}
          />
          <span>
            Contact number verified (confirmed with the provider or their official website). Only
            verified numbers are shown publicly.
          </span>
        </label>
        <p className="muted small">
          Paste only the link to the Maps listing. Do not copy reviews, ratings, photos or other
          business data from Google Maps into Sehatalaya.
        </p>
      </fieldset>

      <fieldset className="card">
        <legend>Photo</legend>
        {currentPhoto ? (
          <div className="photo-current">
            <img src={currentPhoto} alt="Current listing" />
            <label className="check">
              <input
                type="checkbox"
                checked={removePhoto}
                onChange={(e) => setRemovePhoto(e.target.checked)}
              />
              <span>Remove this photo</span>
            </label>
          </div>
        ) : (
          <p className="muted small">
            No photo — a neutral placeholder is shown on the public site.
            {removePhoto ? ' The existing photo will be removed when you save.' : ''}
          </p>
        )}
        <label className="field">
          <span>Upload authorised photo (JPG, PNG or WebP, max 2 MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setPhotoFile(e.target.files?.[0] || null);
              setPhotoConfirm(false);
            }}
          />
        </label>
        {photoFile ? (
          <label className="check">
            <input
              type="checkbox"
              checked={photoConfirm}
              onChange={(e) => setPhotoConfirm(e.target.checked)}
            />
            <span>
              I confirm the provider (or the copyright holder) has authorised Sehatalaya to publish
              this photo. It was not taken from Google Maps or another website without permission.
            </span>
          </label>
        ) : null}
      </fieldset>

      <fieldset className="card">
        <legend>Research source and verification (owner only — never shown publicly)</legend>
        <div className="form-grid">
          <label className="field span-2">
            <span>Source URL</span>
            <input
              type="url"
              value={form.source_url}
              onChange={set('source_url')}
              placeholder="Official website or registration directory page"
            />
          </label>
          <label className="field">
            <span>Date checked</span>
            <div className="inline">
              <input
                type="date"
                value={form.source_checked_on}
                onChange={set('source_checked_on')}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setForm((f) => ({ ...f, source_checked_on: todayIso() }))}
              >
                Today
              </button>
            </div>
          </label>
          <label className="field span-2">
            <span>Source notes</span>
            <textarea value={form.source_notes} onChange={set('source_notes')} rows={2} />
          </label>
          <label className="field span-2">
            <span>Verification notes</span>
            <textarea
              value={form.verification_notes}
              onChange={set('verification_notes')}
              rows={2}
              placeholder="What was checked, with whom, and when"
            />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={form.verified}
            disabled={!canMarkVerified}
            onChange={set('verified')}
          />
          <span>
            Show the public “Verified” badge
            {isDoctor && !canMarkVerified
              ? ' (available only after the doctor’s registration is verified)'
              : ''}
          </span>
        </label>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <Link to="/admin" className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
