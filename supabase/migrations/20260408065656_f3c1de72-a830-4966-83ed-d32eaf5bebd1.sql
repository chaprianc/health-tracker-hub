
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.daily_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
