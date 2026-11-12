import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import com.bookstore.util.PasswordUtil;

/** Read a password from stdin, never from command-line arguments. */
public class LocalDevPasswordHash {
    public static void main(String[] args) throws Exception {
        char[] password = new BufferedReader(new InputStreamReader(System.in,
                StandardCharsets.UTF_8)).readLine().toCharArray();
        try {
            System.out.println(PasswordUtil.hashForStorage(password));
        } finally {
            Arrays.fill(password, '\0');
        }
    }
}
