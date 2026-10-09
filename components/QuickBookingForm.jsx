import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CircleAlert, LoaderCircle } from 'lucide-react';
import { addDaysISO, byRoomNumber, formatCurrency, nightsBetween, roomTypeLabel, todayISO } from '../lib/format';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERVER_FIELD_MAP = { roomId: 'roomId', checkInDate: 'checkIn', checkOutDate: 'checkOut' };
const inputClass = 'w-full rounded-md border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/40 focus:border-brass aria-invalid:border-occ';
function makeBlank() { const today = todayISO(); return { name:'', email:'', phone:'', idNumber:'', roomId:'', checkIn:today, checkOut:addDaysISO(today,1) }; }
function Field({ id, label, error, hint, children }) {
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>{children}{hint && !error && <p className="mt-1 text-xs text-ink/65">{hint}</p>}{error && <p id={`${id}-error`} className="mt-1 text-sm text-occ-ink">{error}</p>}</div>;
}
export default function QuickBookingForm({ rooms, preset, onSubmit }) {
  const [values,setValues] = useState(makeBlank); const [errors,setErrors] = useState({}); const [formError,setFormError] = useState(''); const [submitting,setSubmitting] = useState(false); const nameRef=useRef(null);
  const availableRooms=useMemo(()=>rooms.filter(r=>r.status==='AVAILABLE').sort(byRoomNumber),[rooms]);
  const selectedRoom=availableRooms.find(r=>String(r.id)===values.roomId);
  const nights=nightsBetween(values.checkIn,values.checkOut);
  const total=selectedRoom && nights>0 ? selectedRoom.pricePerNight*nights : null;
  useEffect(()=>{ if(!preset.roomId)return; setValues(v=>({...v,roomId:String(preset.roomId)})); setErrors(e=>({...e,roomId:undefined})); nameRef.current?.focus(); },[preset]);
  const clearError=(field)=>{setErrors(e=>({...e,[field]:undefined}));setFormError('');};
  const update=(field)=>(e)=>{setValues(v=>({...v,[field]:e.target.value}));clearError(field);};
  const updateCheckIn=(e)=>{const checkIn=e.target.value;setValues(v=>({...v,checkIn,checkOut:checkIn&&v.checkOut<=checkIn?addDaysISO(checkIn,1):v.checkOut}));clearError('checkIn');};
  function validate() {
    const found={};
    if(!values.name.trim())found.name="Enter the guest's full name.";
    if(!EMAIL_PATTERN.test(values.email.trim()))found.email='Enter a valid email address, like name@example.com.';
    if(values.phone.replace(/\D/g,'').length<7)found.phone='Enter a phone number with at least 7 digits.';
    if(!values.idNumber.trim())found.idNumber="Enter the number from the guest's identity proof.";
    if(!selectedRoom)found.roomId='Choose an available room.';
    if(!values.checkIn)found.checkIn='Choose a check-in date.';
    else if(values.checkIn<todayISO())found.checkIn="Check-in can't be in the past.";
    if(!values.checkOut)found.checkOut='Choose a check-out date.';
    else if(values.checkOut<=values.checkIn)found.checkOut='Check-out must be after check-in.';
    return found;
  }
  async function handleSubmit(e) {
    e.preventDefault();const found=validate();setErrors(found);if(Object.keys(found).length)return;
    setSubmitting(true);setFormError('');
    try {
      await onSubmit({guest:{name:values.name.trim(),email:values.email.trim(),phone:values.phone.trim(),idNumber:values.idNumber.trim()},roomId:Number(values.roomId),checkInDate:values.checkIn,checkOutDate:values.checkOut});
      setValues(makeBlank());setErrors({});
    } catch(err) {
      const mapped={};Object.entries(err.fieldErrors??{}).forEach(([key,message])=>{if(SERVER_FIELD_MAP[key])mapped[SERVER_FIELD_MAP[key]]=message;});
      setErrors(mapped);setFormError(err.message||'The booking could not be created. Try again.');
    } finally {setSubmitting(false);}
  }
  const describe=(field)=>errors[field]?`${field}-error`:undefined;
  return <section aria-labelledby="booking-heading" className="h-fit self-start border-t-4 border-brass bg-white px-6 py-6 shadow-sm lg:sticky lg:top-6">
    <h2 id="booking-heading" className="font-display text-2xl font-bold">Quick booking</h2><p className="mt-1 text-sm text-ink/70">Create a booking for a guest at the desk. It starts as pending.</p>
    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
      <Field id="name" label="Guest name" error={errors.name}><input id="name" ref={nameRef} type="text" autoComplete="name" value={values.name} onChange={update('name')} aria-invalid={Boolean(errors.name)} aria-describedby={describe('name')} placeholder="Full name" className={inputClass}/></Field>
      <Field id="email" label="Email" error={errors.email}><input id="email" type="email" autoComplete="email" value={values.email} onChange={update('email')} aria-invalid={Boolean(errors.email)} aria-describedby={describe('email')} placeholder="name@example.com" className={inputClass}/></Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><Field id="phone" label="Phone" error={errors.phone}><input id="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update('phone')} aria-invalid={Boolean(errors.phone)} aria-describedby={describe('phone')} placeholder="+91 98480 00000" className={inputClass}/></Field>
      <Field id="idNumber" label="ID number" error={errors.idNumber}><input id="idNumber" type="text" autoComplete="off" value={values.idNumber} onChange={update('idNumber')} aria-invalid={Boolean(errors.idNumber)} aria-describedby={describe('idNumber')} placeholder="From identity proof" className={inputClass}/></Field></div>
      <Field id="roomId" label="Room" error={errors.roomId} hint={availableRooms.length===0?'No rooms are available right now.':`${availableRooms.length} rooms available`}><select id="roomId" value={values.roomId} onChange={update('roomId')} aria-invalid={Boolean(errors.roomId)} aria-describedby={describe('roomId')} className={inputClass}><option value="">Choose a room</option>{availableRooms.map(room=><option key={room.id} value={room.id}>Room {room.roomNumber}, {roomTypeLabel(room.type)}, {formatCurrency(room.pricePerNight)} per night</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3"><Field id="checkIn" label="Check-in" error={errors.checkIn}><input id="checkIn" type="date" min={todayISO()} value={values.checkIn} onChange={updateCheckIn} aria-invalid={Boolean(errors.checkIn)} aria-describedby={describe('checkIn')} className={inputClass}/></Field>
      <Field id="checkOut" label="Check-out" error={errors.checkOut}><input id="checkOut" type="date" min={values.checkIn?addDaysISO(values.checkIn,1):todayISO()} value={values.checkOut} onChange={update('checkOut')} aria-invalid={Boolean(errors.checkOut)} aria-describedby={describe('checkOut')} className={inputClass}/></Field></div>
      <div className="rounded-md bg-paper px-4 py-3" aria-live="polite">{total!==null?<><p className="text-sm text-ink/75">{nights} {nights===1?'night':'nights'} at {formatCurrency(selectedRoom.pricePerNight)}</p><p className="font-display text-2xl font-bold">{formatCurrency(total)}</p></>:<p className="text-sm text-ink/70">Choose a room and dates to see the total.</p>}</div>
      {formError && <div role="alert" className="flex gap-2 rounded-md bg-occ-tint px-4 py-3 text-sm text-occ-ink"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true"/><p>{formError}</p></div>}
      <button type="submit" disabled={submitting||availableRooms.length===0} className="flex w-full items-center justify-center gap-2 rounded-md bg-brass px-4 py-3 text-sm font-semibold text-white hover:bg-brass-dark disabled:cursor-not-allowed disabled:opacity-60">{submitting?<><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true"/>Creating booking</>:<><CalendarCheck className="size-4" aria-hidden="true"/>Create booking</>}</button>
    </form>
  </section>;
}
