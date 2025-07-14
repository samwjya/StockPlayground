#example 1:
def strategy(df):
    df['sma5'] = df['Close'].rolling(5).mean()
    return df['Close'] > df['sma5']

