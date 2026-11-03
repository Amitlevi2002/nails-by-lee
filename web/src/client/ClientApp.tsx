import type { Info } from '../lib/types';
import { useState, useMemo, useEffect } from 'react';
import { store } from '../lib/storage';
import { NAME, SHADE, TOKEN } from './session';
import { makeApi } from '../lib/api';
import { Welcome } from './Welcome';
import { Booking } from './Booking';
import { BrandBar } from './Brand';
import { inkOn, shadeById, type ShadeId } from '../lib/shades';

export function ClientApp({ info }: { info: Info }) {
  const [token, setToken] = useState(store.get(TOKEN));
  const [name, setName] = useState(store.get(NAME) || '');
  // the shade she tried on follows her through the booking and is sent to Lee with the request
  const [shade, setShade] = useState<ShadeId>(() => shadeById(store.get(SHADE)).id);
  useEffect(() => {
    store.set(SHADE, shade);
    const s = shadeById(shade);
    document.documentElement.style.setProperty('--shade', s.hex);
    document.documentElement.style.setProperty('--on-shade', inkOn(s.hex));
  }, [shade]);
  const logout = () => {
    store.del(TOKEN);
    store.del(NAME);
    setToken(null);
  };
  const api = useMemo(() => makeApi(TOKEN, logout), []);
  if (!token)
    return (
      <Welcome
        info={info}
        shade={shade}
        onShade={setShade}
        onDone={(t, n) => {
          store.set(TOKEN, t);
          store.set(NAME, n);
          setName(n);
          setToken(t);
        }}
      />
    );
  return (
    <>
      <BrandBar />
      <Booking api={api} info={info} name={name} shade={shade} onShade={setShade} onLogout={logout} />
    </>
  );
}
