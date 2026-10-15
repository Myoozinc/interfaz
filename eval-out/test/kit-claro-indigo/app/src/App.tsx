import './styles/theme.css';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast, Toaster } from 'sonner';
export default function App() {
  const [plan, setPlan] = useState('pro'); const [on, setOn] = useState(true);
  return (<div className="min-h-screen bg-background text-foreground p-8">
    <Toaster richColors />
    <h1 className="font-display text-4xl font-bold mb-6">Panel de prueba</h1>
    <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">Resumen</TabsTrigger><TabsTrigger value="b">Clientes</TabsTrigger></TabsList>
    <TabsContent value="a"><div className="grid md:grid-cols-3 gap-4">
      {['Ventas','Pedidos','Clientes'].map((t,i)=>(<Card key={t}><CardHeader><CardDescription>{t}</CardDescription><CardTitle className="text-3xl">{(i+1)*1234}</CardTitle></CardHeader><CardContent><Progress value={30+i*20} /><Badge variant="success" className="mt-3">+12%</Badge></CardContent></Card>))}
    </div>
    <Card className="mt-4"><CardHeader><CardTitle>Ajustes</CardTitle></CardHeader><CardContent className="space-y-3"><Label>Nombre</Label><Input placeholder="Tu nombre" />
      <Select value={plan} onValueChange={setPlan}><SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger><SelectContent><SelectItem value="free">Gratis</SelectItem><SelectItem value="pro">Pro</SelectItem></SelectContent></Select>
      <div className="flex items-center gap-2"><Switch checked={on} onCheckedChange={setOn} /> Notificaciones</div></CardContent>
      <CardFooter><Button onClick={()=>toast.success('Guardado')}>Guardar</Button><Button variant="outline">Cancelar</Button>
      <Dialog><DialogTrigger asChild><Button variant="secondary">Abrir</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Hola</DialogTitle><DialogDescription>Diálogo</DialogDescription></DialogHeader><DialogFooter><Button>OK</Button></DialogFooter></DialogContent></Dialog></CardFooter></Card>
    </TabsContent>
    <TabsContent value="b"><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="flex items-center gap-2"><Avatar><AvatarFallback>AL</AvatarFallback></Avatar>Ana López</TableCell><TableCell><Badge>Activo</Badge></TableCell></TableRow></TableBody></Table></TabsContent></Tabs>
  </div>);
}